import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { streamText } from "ai";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AI_CONFIG, googleAI } from "@/lib/ai/gemini";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { searchSimilarChunks } from "@/lib/ai/vector-store";
import { buildRAGPrompt } from "@/lib/ai/prompt-builder";
import { resolveHealthyChatModel } from "@/lib/ai/model-health";

export const runtime = "nodejs";

type ChatRequestBody = {
  message?: string;
  messages?: Array<{ role: string; content: string }>;
  conversationId?: string;
  materialIds?: string[];
};

function extractLatestUserMessage(body: ChatRequestBody): string | null {
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const lastUserMessage = [...body.messages]
      .reverse()
      .find((m) => m.role === "user" && typeof m.content === "string");

    if (lastUserMessage?.content.trim()) {
      return lastUserMessage.content.trim();
    }
  }

  return null;
}

function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Model request failed";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = extractLatestUserMessage(body);
    const conversationId = body.conversationId;
    const materialIds = Array.isArray(body.materialIds) ? body.materialIds : [];

    if (!message) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const hasMaterials = materialIds.length > 0;

    let conversation;
    if (conversationId) {
      conversation = await prisma.aiConversation.findUnique({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
    } else {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: session.user.id,
          materialIds,
          title: message.slice(0, 50),
        },
      });
    }

    const activeConversationId = conversation.id;

    await prisma.aiMessage.create({
      data: {
        conversationId: activeConversationId,
        role: "USER",
        content: message,
      },
    });

    let relevantChunks: any[] = [];
    let prompt = message;
    let systemPrompt =
      "You are a helpful study assistant. Answer questions clearly and concisely.";

    if (hasMaterials) {
      const queryEmbedding = await generateEmbedding(message);
      relevantChunks = (await searchSimilarChunks(
        queryEmbedding,
        materialIds,
        AI_CONFIG.SIMILARITY_THRESHOLD,
        AI_CONFIG.TOP_K_CHUNKS,
      )) as any[];

      prompt = buildRAGPrompt(message, relevantChunks);
      systemPrompt =
        "You are a helpful study assistant. Answer based on the provided study material context. If the context doesn't contain relevant information, say so honestly.";
    }

    const { modelId, usedFallback } = await resolveHealthyChatModel();
    console.log("[Chat API] model selected", { modelId, usedFallback });

    const result = streamText({
      model: googleAI(modelId),
      system: systemPrompt,
      prompt,
      temperature: AI_CONFIG.TEMPERATURE,
      timeout: 20000,
      maxRetries: 1,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
      onError({ error }) {
        console.error("[Chat API] stream error", {
          modelId,
          message: toSafeErrorMessage(error),
        });
      },
      async onFinish({ text, usage }) {
        try {
          await Promise.all([
            prisma.aiMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "ASSISTANT",
                content: text,
                sources: hasMaterials ? JSON.stringify(relevantChunks) : undefined,
                promptTokens: usage?.inputTokens ?? 0,
                completionTokens: usage?.outputTokens ?? 0,
                totalTokens: usage?.totalTokens ?? 0,
              },
            }),
            prisma.aiConversation.update({
              where: { id: activeConversationId },
              data: { lastMessageAt: new Date() },
            }),
          ]);
        } catch (saveError) {
          console.error("[Chat API] save error", {
            modelId,
            message: toSafeErrorMessage(saveError),
          });
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "x-ai-model-id": modelId,
        "x-ai-model-fallback": String(usedFallback),
        "x-conversation-id": activeConversationId,
      },
    });
  } catch (error) {
    const errorMessage = toSafeErrorMessage(error);
    console.error("[Chat API] fatal error", { message: errorMessage });

    const status = errorMessage.toLowerCase().includes("api key") ? 500 : 500;
    return NextResponse.json(
      {
        error: "AI assistant is currently unavailable. Please try again.",
        details: errorMessage,
      },
      { status },
    );
  }
}
