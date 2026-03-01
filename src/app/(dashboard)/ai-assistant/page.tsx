/** @format */

"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
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

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: "/api/ai/chat",
    streamProtocol: "text",
    body: {
      conversationId,
      materialIds: selectedMaterials,
    },
    onError(error) {
      console.error("Chat error:", error);
    },
  });

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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4 hidden md:block">
        <ConversationList
          onSelectConversation={setConversationId}
          currentConversationId={conversationId}
        />
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col p-4">
        <ChatInterface
          messages={messages}
          input={input}
          onInputChange={handleInputChange}
          onSubmit={(e) => {
            e.preventDefault();

            if (!input.trim()) return;

            handleSubmit(e);
          }}
          isLoading={isLoading}
          selectedMaterials={selectedMaterials}
          onSelectMaterials={setSelectedMaterials}
        />
      </main>
    </div>
  );
}
