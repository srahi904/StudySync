/** @format */

"use client";

import { useState, useEffect } from "react";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ChatInterface = dynamic(
  () =>
    import("@/components/ai/chat-interface").then((mod) => mod.ChatInterface),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const ConversationList = dynamic(
  () =>
    import("@/components/ai/conversation-list").then(
      (mod) => mod.ConversationList,
    ),
  {
    loading: () => (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading history...
      </div>
    ),
  },
);

export default function AIAssistantPage() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [modelNotice, setModelNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setChatError(null);
    setInput("");

    const newMessages = [...messages, { id: Date.now().toString(), role: "user", content }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          messages: newMessages,
          conversationId,
          materialIds: selectedMaterials,
        }),
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          setChatError(
            data?.error || data?.details || "AI assistant is unavailable right now. Please try again."
          );
        } catch {
          setChatError("AI assistant is unavailable right now. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const responseConversationId = response.headers.get("x-conversation-id");
      if (!conversationId && responseConversationId) {
        setConversationId(responseConversationId);
      }

      const usedFallback = response.headers.get("x-ai-model-fallback") === "true";
      setModelNotice(usedFallback ? "Primary Gemini model unavailable. Using fallback model." : null);

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = Date.now().toString() + "-ai";

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        assistantMessage += text;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantMessage }
              : msg
          )
        );
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setChatError(error.message || "Failed to get response from AI assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing conversation when ID changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/ai/conversations/${conversationId}/messages`,
        );

        if (!res.ok) throw new Error("Failed to load conversation");

        const data = await res.json();

        setMessages(
          data.map((m: any) => ({
            id: m.id,
            role: m.role.toLowerCase(),
            content: m.content,
          })),
        );
      } catch (err) {
        console.error("Conversation load error:", err);
        setMessages([]);
      }
    };

    loadConversation();
  }, [conversationId, setMessages]);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:block w-[320px] border-r border-border bg-card">
        <ConversationList
          onSelectConversation={setConversationId}
          currentConversationId={conversationId}
        />
      </aside>

      {/* Chat Area */}
      <main className="flex-1 min-w-0 flex flex-col p-4 md:p-5">
        {chatError && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {chatError}
          </div>
        )}
        {modelNotice && (
          <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {modelNotice}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            input={input}
            onInputChange={(e: any) => setInput(e.target.value)}
            onSubmit={(e) => {
              e.preventDefault();

              if (!input.trim() || isLoading) return;

              setChatError(null);
              sendMessage(input);
            }}
            isLoading={isLoading}
            selectedMaterials={selectedMaterials}
            onSelectMaterials={setSelectedMaterials}
          />
        </div>
      </main>
    </div>
  );
}
