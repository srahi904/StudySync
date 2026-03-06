// src/app/(dashboard)/public-chat/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { usePusherMulti } from '@/hooks/use-pusher';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { Hash, Users, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/utils/audio';

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

export default function PublicChatFullScreenPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const res = await fetch(`/api/chat/public/messages?channelId=${activeChannel.id}&limit=100`);
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

  return (
    <div className="flex h-full bg-card overflow-hidden">
      {/* Channels Sidebar */}
      <div className={cn(
        "w-full md:w-64 border-r border-border bg-card flex-col flex-shrink-0 z-20",
        showSidebar ? "flex" : "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            Public Channels
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-3">
          {channels.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChannel(ch);
                  setShowSidebar(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors text-left',
                  activeChannel?.id === ch.id && 'bg-primary/10 text-primary border-r-2 border-primary'
                )}
              >
                <Hash className="w-4 h-4 flex-shrink-0 opacity-70" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ch.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex-col min-w-0 bg-background relative",
        showSidebar ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="h-16 border-b border-border bg-card sticky top-0 z-10 flex items-center px-4 md:px-6 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden mr-3 p-1.5 -ml-1 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Hash className="w-5 h-5 text-primary mr-2" />
            <h1 className="font-bold text-lg">{activeChannel?.name || 'Loading...'}</h1>
            {activeChannel?.topic && (
              <>
                <span className="text-border mx-2">|</span>
                <span className="text-sm text-muted-foreground truncate max-w-sm">
                  {activeChannel.topic}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Welcome to #{activeChannel?.name}</h2>
              <p>This is the start of the #{activeChannel?.name} channel.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.sender.id === session?.user?.id}
                onDelete={msg.sender.id === session?.user?.id ? handleDelete : undefined}
                showAvatar
              />
            ))
          )}
          {typingUser && <TypingIndicator userName={typingUser} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto">
            <MessageInput
              onSend={handleSend}
              onTyping={handleTyping}
              placeholder={`Message #${activeChannel?.name || 'general'}...`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
