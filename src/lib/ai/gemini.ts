/** @format */

import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Create a configured Google provider
console.log("[Gemini Config] API Key status:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Detected" : "Missing");
export const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "dummy_key",
});

// Models configuration
export const AI_MODELS = {
  EMBEDDING: "gemini-embedding-001",
  CHAT: "gemini-1.5-flash-8b",
  CHAT_PREMIUM: "gemini-1.5-pro",
} as const;

// Configuration
export const AI_CONFIG = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  TOP_K_CHUNKS: 5,
  SIMILARITY_THRESHOLD: 0.7,
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
} as const;
