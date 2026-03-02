import { generateText } from "ai";
import { AI_MODELS, googleAI } from "@/lib/ai/gemini";

const HEALTH_CACHE_TTL_MS = 5 * 60 * 1000;
const PROBE_PROMPT = "Reply with exactly: ok";

type HealthCache = {
  modelId: string;
  usedFallback: boolean;
  expiresAt: number;
};

let healthCache: HealthCache | null = null;

type ProbeResult = {
  ok: boolean;
  modelId: string;
  latencyMs: number;
  error?: string;
};

async function probeModel(modelId: string): Promise<ProbeResult> {
  const startedAt = Date.now();

  try {
    const result = await generateText({
      model: googleAI(modelId),
      prompt: PROBE_PROMPT,
      maxOutputTokens: 4,
      temperature: 0,
      maxRetries: 0,
      timeout: 8000,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
    });

    return {
      ok: true,
      modelId,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      modelId,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Model probe failed",
    };
  }
}

export async function resolveHealthyChatModel(): Promise<{
  modelId: string;
  usedFallback: boolean;
}> {
  const now = Date.now();

  if (healthCache && healthCache.expiresAt > now) {
    return {
      modelId: healthCache.modelId,
      usedFallback: healthCache.usedFallback,
    };
  }

  const primary = await probeModel(AI_MODELS.CHAT_PRIMARY);
  if (primary.ok) {
    healthCache = {
      modelId: primary.modelId,
      usedFallback: false,
      expiresAt: now + HEALTH_CACHE_TTL_MS,
    };
    return { modelId: primary.modelId, usedFallback: false };
  }

  const fallback = await probeModel(AI_MODELS.CHAT_FALLBACK);
  if (fallback.ok) {
    healthCache = {
      modelId: fallback.modelId,
      usedFallback: true,
      expiresAt: now + HEALTH_CACHE_TTL_MS,
    };
    return { modelId: fallback.modelId, usedFallback: true };
  }

  throw new Error(
    `No healthy Gemini chat model available. Primary: ${primary.error ?? "failed"}; Fallback: ${fallback.error ?? "failed"}`,
  );
}

export async function getModelHealthSnapshot() {
  const keyConfigured = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (!keyConfigured) {
    return {
      ok: false,
      keyConfigured: false,
      modelId: null as string | null,
      latencyMs: null as number | null,
      error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
    };
  }

  const startedAt = Date.now();
  try {
    const { modelId, usedFallback } = await resolveHealthyChatModel();
    return {
      ok: true,
      keyConfigured: true,
      modelId,
      usedFallback,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      keyConfigured: true,
      modelId: null as string | null,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Health check failed",
    };
  }
}
