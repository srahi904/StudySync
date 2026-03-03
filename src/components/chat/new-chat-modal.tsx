// src/components/chat/new-chat-modal.tsx
'use client';

import { useState, useCallback } from 'react';
import { Search, X, Loader2, MessageCircle, Lock } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  image?: string | null;
  bio?: string | null;
  university?: string | null;
  followersCount: number;
  isFollowing?: boolean;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onStartChat }: NewChatModalProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/explore/users?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartChat = async (userId: string) => {
    setStarting(userId);
    setError(null);
    try {
      const res = await fetch('/api/chat/private/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start conversation');
      }

      const data = await res.json();
      onStartChat(data.conversation.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      setError(message);
    } finally {
      setStarting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold">New Message</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search people..."
              className="w-full rounded-xl bg-muted/50 border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              {search ? 'No users found' : 'Search for a user to message'}
            </div>
          ) : (
            users.map((user) => {
              const avatarUrl = user.avatar || user.image;
              return (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  disabled={!!starting}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{getInitials(user.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.university || user.email}</p>
                  </div>
                  {starting === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer note */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-[10px] text-muted-foreground text-center">
            💬 Both users must follow each other to start a private conversation
          </p>
        </div>
      </div>
    </div>
  );
}
