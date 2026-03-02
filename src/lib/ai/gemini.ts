/** @format */

import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

console.log(
  "[Gemini Config] API key configured:",
  apiKey ? "yes" : "no",
);

if (!apiKey) {
  throw new Error(
    "Missing GOOGLE_GENERATIVE_AI_API_KEY. Set it in your server environment.",
  );
}

export const googleAI = createGoogleGenerativeAI({
  apiKey,
});

// Models configuration
export const AI_MODELS = {
  EMBEDDING: "gemini-embedding-001",
  CHAT_PRIMARY: "gemini-2.5-flash",
  CHAT_FALLBACK: "gemini-2.0-flash",
  CHAT_PREMIUM: "gemini-2.5-pro",
} as const;

// Configuration
export const AI_CONFIG = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  TOP_K_CHUNKS: 5,
  SIMILARITY_THRESHOLD: 0.45,
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
} as const;
