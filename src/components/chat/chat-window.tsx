// src/components/chat/chat-window.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { OnlineIndicator } from './online-indicator';
import { usePusherMulti } from '@/hooks/use-pusher';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { useActiveList } from '@/components/chat/active-status-provider';
import { ArrowLeft, Loader2, MessageSquare, Phone, Video, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { playNotificationSound } from '@/lib/utils/audio';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender: { id: string; name: string; avatar?: string | null; image?: string | null };
  status?: string;
  isRead?: boolean;
  createdAt: string;
  _sending?: boolean;
  _failed?: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  otherUser: {
    id: string;
    username?: string | null;
    name: string;
    avatar?: string | null;
    image?: string | null;
    isOnline?: boolean;
  };
  onBack?: () => void;
}

export function ChatWindow({ conversationId, otherUser, onBack }: ChatWindowProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSendingTyping, setIsSendingTyping] = useState(false);
  const activeUsers = useActiveList();
  
  const isOnline = activeUsers.has(otherUser.id);

  // Load messages
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/private/messages?conversationId=${conversationId}&limit=50`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (error) {
        console.error('Load messages error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pusher subscription
  usePusherMulti({
    channelName: session?.user?.id ? CHANNELS.dm(session.user.id, otherUser.id) : '',
    events: {
      [EVENTS.NEW_PRIVATE_MESSAGE]: (data: unknown) => {
        const msg = data as Message;
        
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          if (msg.sender?.id === session?.user?.id) return prev;
          
          playNotificationSound();
          return [...prev, msg];
        });

        // Mark it as read immediately since the user is in the chat window
        if (msg.sender?.id !== session?.user?.id) {
          fetch('/api/chat/private/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId })
          }).catch(console.error);
        }
      },
      [EVENTS.MESSAGE_READ]: (data: unknown) => {
        const { messageIds } = data as { messageIds: string[] };
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m.id) ? { ...m, isRead: true, status: 'READ' } : m
          )
        );
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
    enabled: !!session?.user?.id && !!otherUser.id,
  });

  // Send message
  const handleSend = useCallback(async (content: string) => {
    if (!session?.user) return;

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
      status: 'SENT',
      createdAt: new Date().toISOString(),
      _sending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/private/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...data.message, _sending: false } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _sending: false, _failed: true } : m)));
    }
  }, [session, conversationId]);

  // Typing indicator (debounced)
  const handleTyping = useCallback(() => {
    if (isSendingTyping) return;
    setIsSendingTyping(true);

    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelType: 'private', targetUserId: otherUser.id, isTyping: true }),
    }).catch(() => {});

    if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
    sendTypingTimeoutRef.current = setTimeout(() => setIsSendingTyping(false), 3000);
  }, [otherUser.id, isSendingTyping]);

  const avatarUrl = otherUser.avatar || otherUser.image;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link href={`/profile/${otherUser.username || otherUser.id}`} className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0 w-11 h-11">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{getInitials(otherUser.name)}</span>
                )}
              </div>
              <OnlineIndicator
                isOnline={isOnline || false}
                size="sm"
                className="absolute -bottom-0.5 -right-0.5 border-2 border-background"
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <p className="font-bold text-[15px] truncate group-hover:text-primary transition-colors">{otherUser.name}</p>
              <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                Student
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                {isOnline ? 'Active now' : 'Offline'}
              </p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground mr-2">
          <button className="hover:text-foreground transition-colors p-1" title="Voice call">
            <Phone className="w-5 h-5" />
          </button>
          <button className="hover:text-foreground transition-colors p-1" title="Video call">
            <Video className="w-5 h-5" />
          </button>
          <button className="hover:text-foreground transition-colors p-1" title="Information">
            <Info className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-border mx-1"></div>
          <button onClick={onBack} className="hover:text-destructive transition-colors p-1" title="Close chat">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium">Start a conversation</p>
            <p className="text-xs mt-1">Send a message to {otherUser.name}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender.id === session?.user?.id}
              showAvatar={true}
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
        placeholder={`Message ${otherUser.name}...`}
      />
    </div>
  );
}
