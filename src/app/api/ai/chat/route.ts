/** @format */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AI_MODELS, AI_CONFIG } from "@/lib/ai/gemini";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { searchSimilarChunks } from "@/lib/ai/vector-store";
import { buildRAGPrompt } from "@/lib/ai/prompt-builder";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Chat API] Starting request...");
    const body = await request.json();
    const { conversationId, materialIds } = body;
    console.log("[Chat API] Request body:", { conversationId, materialIds, messageCount: body.messages?.length });

    // ✅ Handle both formats:
    // useChat sends:    { messages: [{ role: "user", content: "..." }], materialIds, conversationId }
    // Direct fetch:     { message: "...", materialIds, conversationId }
    let message: string | undefined;

    if (typeof body.message === "string" && body.message.trim()) {
      message = body.message.trim();
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const lastUserMsg = [...body.messages]
        .reverse()
        .find((m: any) => m.role === "user");
      message = lastUserMsg?.content?.trim();
    }

    console.log("[Chat API] Extracted message:", message);

    // Validate
    if (!message) {
      console.error("[Chat API] Validation failed: message is missing");
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const hasMaterials = Array.isArray(materialIds) && materialIds.length > 0;

    // Get or create conversation with ownership check
    let conversation;
    console.log("[Chat API] Finding/Creating conversation...");
    if (conversationId) {
      conversation = await prisma.aiConversation.findUnique({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      });

      if (!conversation) {
        console.error("[Chat API] Conversation not found:", conversationId);
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
      console.log("[Chat API] Created new conversation:", conversation.id);
    }

    const activeConversationId = conversation.id;

    // Save user message
    console.log("[Chat API] Saving user message...");
    await prisma.aiMessage.create({
      data: {
        conversationId: activeConversationId,
        role: "USER",
        content: message,
      },
    });

    let relevantChunks: any[] = [];
    let prompt = message;
    let systemPrompt = "You are a helpful study assistant. Answer questions clearly and concisely.";

    if (hasMaterials) {
      // Step 1: Generate query embedding
      console.log("[Chat API] Generating query embedding...");
      const queryEmbedding = await generateEmbedding(message);
      console.log("[Chat API] Generated embedding size:", queryEmbedding.length);

      // Step 2: Search similar chunks
      console.log("[Chat API] Searching similar chunks...");
      relevantChunks = (await searchSimilarChunks(
        queryEmbedding,
        materialIds,
        AI_CONFIG.SIMILARITY_THRESHOLD,
        AI_CONFIG.TOP_K_CHUNKS,
      )) as any[];
      console.log("[Chat API] Found chunks:", relevantChunks.length);

      // Step 3: Build RAG prompt
      console.log("[Chat API] Building RAG prompt...");
      prompt = buildRAGPrompt(message, relevantChunks);
      systemPrompt = "You are a helpful study assistant. Answer based on the provided study material context. If the context doesn't contain relevant information, say so honestly.";
    }

    // Step 4: Stream response
    console.log("[Chat API] Starting streamText...");
    const { googleAI } = await import("@/lib/ai/gemini");

    const result = streamText({
      model: googleAI(AI_MODELS.CHAT),
      system: systemPrompt,
      prompt,
      temperature: AI_CONFIG.TEMPERATURE,
      async onFinish({ text, usage }) {
        console.log("[Chat API] Stream finished perfectly.");
        try {
          await Promise.all([
            prisma.aiMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "ASSISTANT",
                content: text,
                sources: hasMaterials ? JSON.stringify(relevantChunks) : undefined,
                promptTokens: (usage as any)?.promptTokens ?? 0,
                completionTokens: (usage as any)?.completionTokens ?? 0,
                totalTokens: (usage as any)?.totalTokens ?? 0,
              },
            }),
            prisma.aiConversation.update({
              where: { id: activeConversationId },
              data: { lastMessageAt: new Date() },
            }),
          ]);
          console.log("[Chat API] Assistant message saved.");
        } catch (saveError) {
          console.error("[Chat API] Failed to save assistant message:", saveError);
        }
      },
    });

    console.log("[Chat API] Returning stream response.");
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Chat API] Final catch block error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
