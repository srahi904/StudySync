// src/app/(dashboard)/chat/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { ConversationList } from '@/components/chat/conversation-list';
import { ChatWindow } from '@/components/chat/chat-window';
import { NewChatModal } from '@/components/chat/new-chat-modal';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedConversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string | null;
    image?: string | null;
    isOnline?: boolean;
  };
}

export default function ChatPage() {
  const [selected, setSelected] = useState<SelectedConversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const handleSelect = useCallback((conv: SelectedConversation) => {
    setSelected(conv);
  }, []);

  const handleNewChat = useCallback((conversationId: string) => {
    // Reload the page to get the new conversation
    window.location.reload();
  }, []);

  return (
    <div className="flex h-full bg-card overflow-hidden">
      {/* Conversation list — always visible on desktop, hidden when chat selected on mobile */}
      <div
        className={cn(
          'w-full lg:w-[350px] lg:min-w-[350px] border-r border-border flex-shrink-0 bg-background',
          selected ? 'hidden lg:flex flex-col' : 'flex flex-col'
        )}
      >
        <ConversationList
          selectedId={selected?.id}
          onSelect={handleSelect}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>

      {/* Chat window — visible when a conversation is selected */}
      <div
        className={cn(
          'flex-1 min-w-0 bg-background flex flex-col',
          !selected ? 'hidden lg:flex' : 'flex'
        )}
      >
        {selected ? (
          <ChatWindow
            conversationId={selected.id}
            otherUser={selected.otherUser}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground px-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
            <p className="text-sm text-center max-w-xs">
              Send private messages to people you and they follow each other.
              Start a new conversation!
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* New chat modal */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onStartChat={handleNewChat}
      />
    </div>
  );
}
