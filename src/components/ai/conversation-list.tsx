'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

export function ConversationList({
  onSelectConversation,
  currentConversationId,
}: {
  onSelectConversation: (id: string | null) => void;
  currentConversationId: string | null;
}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const fetchConversations = (signal?: AbortSignal) => {
    fetch('/api/ai/conversations?limit=30', { signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setLoadedOnce(true);
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if ((error as Error)?.name === 'AbortError') return;
        setLoadedOnce(true);
        setConversations([]);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchConversations(controller.signal);
    return () => controller.abort();
  }, []);

  // Only refetch when a new conversation id appears that is not already in sidebar.
  useEffect(() => {
    if (!currentConversationId || !loadedOnce) return;

    const exists = conversations.some((conv) => conv.id === currentConversationId);
    if (!exists) {
      fetchConversations();
    }
  }, [currentConversationId, conversations, loadedOnce]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) return;

      if (currentConversationId === id) {
        onSelectConversation(null);
        fetchConversations();
      } else {
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="flex h-full flex-col p-4">
      <button
        onClick={() => onSelectConversation(null)}
        className="mb-4 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>

      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        History
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
            No conversations yet.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = currentConversationId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-background/40 text-foreground hover:border-border/80'
                }`}
              >
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{conv.title}</span>
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-red-500/20 hover:text-red-300 opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
