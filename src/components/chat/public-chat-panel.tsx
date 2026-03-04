// src/components/chat/public-chat-panel.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { usePusherMulti } from '@/hooks/use-pusher';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { Hash, ChevronDown, ChevronUp, Users, Loader2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/utils/audio';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  topic?: string | null;
  subject?: string | null;
}

interface Message {
  id: string;
  content: string;
  sender: { id: string; name: string; avatar?: string | null; image?: string | null };
  createdAt: string;
  _sending?: boolean;
  _failed?: boolean;
}

export function PublicChatPanel() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showChannels, setShowChannels] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const res = await fetch('/api/chat/public/channels');
        const data = await res.json();
        if (data.channels?.length > 0) {
          setChannels(data.channels);
          setActiveChannel(data.channels[0]);
        } else {
          // Create a default general channel
          const createRes = await fetch('/api/chat/public/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'General', topic: 'General discussion', subject: 'General' }),
          });
          const created = await createRes.json();
          if (created.channel) {
            setChannels([created.channel]);
            setActiveChannel(created.channel);
          }
        }
      } catch (error) {
        console.error('Load channels error:', error);
      }
    };
    loadChannels();
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/public/messages?channelId=${activeChannel.id}&limit=50`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (error) {
        console.error('Load messages error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [activeChannel?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pusher real-time subscription
  usePusherMulti({
    channelName: activeChannel ? CHANNELS.publicChannel(activeChannel.id) : '',
    events: {
      [EVENTS.NEW_PUBLIC_MESSAGE]: (data: unknown) => {
        const msg = data as Message;
        
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Don't add own message (already added optimistically)
          if (msg.sender?.id === session?.user?.id) return prev;
          
          playNotificationSound();
          return [...prev, msg];
        });
      },
      [EVENTS.DELETE_PUBLIC_MESSAGE]: (data: unknown) => {
        const { messageId } = data as { messageId: string };
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
      [EVENTS.TYPING_START]: (data: unknown) => {
        const { name, userId } = data as { name: string; userId: string };
        if (userId !== session?.user?.id) {
          setTypingUser(name);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      },
      [EVENTS.TYPING_STOP]: () => {
        setTypingUser(null);
      },
    },
    enabled: !!activeChannel,
  });

  // Send message
  const handleSend = useCallback(async (content: string) => {
    if (!activeChannel || !session?.user) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      content,
      sender: {
        id: session.user.id,
        name: session.user.name || 'You',
        avatar: session.user.avatar,
        image: session.user.image,
      },
      createdAt: new Date().toISOString(),
      _sending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/public/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannel.id, content }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...data.message, _sending: false } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _sending: false, _failed: true } : m)));
    }
  }, [activeChannel, session]);

  // Delete own message
  const handleDelete = useCallback(async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/public/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, []);

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (!activeChannel) return;
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelType: 'public', channelId: activeChannel.id, isTyping: true }),
    }).catch(() => {});
  }, [activeChannel]);

  // Close channel dropdown when clicking outside
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setShowChannels(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-24 lg:bottom-8 right-4 z-20 bg-primary text-primary-foreground p-3 rounded-full shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
        title="Open Public Chat"
      >
        <Hash className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div ref={panelRef} className="fixed bottom-24 lg:bottom-8 right-4 z-[100] w-80 h-[28rem] bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-4 h-4 text-primary flex-shrink-0" />
          <button
            onClick={() => setShowChannels(!showChannels)}
            className="font-semibold text-sm truncate hover:text-primary transition-colors flex items-center gap-1"
          >
            {activeChannel?.name || 'Public Chat'}
            {showChannels ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/public-chat"
            className="p-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Open Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel selector dropdown */}
      {showChannels && (
        <div className="absolute top-14 left-3 right-3 z-30 border border-border bg-card rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { setActiveChannel(ch); setShowChannels(false); }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors',
                ch.id === activeChannel?.id && 'bg-primary/10 text-primary'
              )}
            >
              <Hash className="w-3 h-3" />
              {ch.name}
              {ch.subject && <span className="text-[10px] text-muted-foreground ml-auto">{ch.subject}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm px-4 text-center">
            <Hash className="w-8 h-8 mb-2 opacity-30" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender.id === session?.user?.id}
              onDelete={msg.sender.id === session?.user?.id ? handleDelete : undefined}
            />
          ))
        )}
        {typingUser && <TypingIndicator userName={typingUser} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        placeholder="Message #general..."
      />
    </div>
  );
}
