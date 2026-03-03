// src/hooks/use-chat.ts
'use client';

import { useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
    image?: string | null;
  };
  attachments?: unknown;
  status?: string;
  isRead?: boolean;
  createdAt: string;
  _sending?: boolean;
  _failed?: boolean;
}

interface UseChatOptions {
  conversationId?: string;
  channelId?: string;
  type: 'public' | 'private';
}

export function useChat({ conversationId, channelId, type }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);

  // Load messages
  const loadMessages = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (type === 'public' && channelId) {
        params.set('channelId', channelId);
      } else if (type === 'private' && conversationId) {
        params.set('conversationId', conversationId);
      }
      if (!reset && cursorRef.current) {
        params.set('cursor', cursorRef.current);
      }
      params.set('limit', '50');

      const endpoint = type === 'public'
        ? `/api/chat/public/messages?${params}`
        : `/api/chat/private/messages?${params}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.messages) {
        if (reset) {
          setMessages(data.messages);
        } else {
          setMessages((prev) => [...data.messages, ...prev]);
        }
        cursorRef.current = data.nextCursor;
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  }, [type, channelId, conversationId, loading]);

  // Send message (optimistic update)
  const sendMessage = useCallback(async (content: string, attachments?: unknown) => {
    if (sending || !content.trim()) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: content.trim(),
      sender: { id: '', name: '', avatar: null }, // Will be replaced
      attachments,
      createdAt: new Date().toISOString(),
      _sending: true,
    };

    // Optimistic add
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const endpoint = type === 'public'
        ? '/api/chat/public/messages'
        : '/api/chat/private/messages';

      const body = type === 'public'
        ? { channelId, content: content.trim(), attachments }
        : { conversationId, content: content.trim(), attachments };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to send');

      const data = await res.json();

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data.message, _sending: false } : m))
      );
    } catch (error) {
      console.error('Send message error:', error);
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, _sending: false, _failed: true } : m))
      );
    } finally {
      setSending(false);
    }
  }, [type, channelId, conversationId, sending]);

  // Add incoming message from Pusher
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Don't add duplicates
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // Remove message (for deletes)
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((messageIds: string[]) => {
    setMessages((prev) =>
      prev.map((m) =>
        messageIds.includes(m.id) ? { ...m, isRead: true, status: 'READ' } : m
      )
    );
  }, []);

  return {
    messages,
    loading,
    sending,
    hasMore,
    loadMessages,
    sendMessage,
    addMessage,
    removeMessage,
    markAsRead,
    setMessages,
  };
}
