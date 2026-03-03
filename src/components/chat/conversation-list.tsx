// src/components/chat/conversation-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, isToday, isYesterday } from 'date-fns';
import { Search, MessageCirclePlus, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { OnlineIndicator } from './online-indicator';
import { usePusher } from '@/hooks/use-pusher';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { useActiveList } from '@/components/chat/active-status-provider';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string | null;
    image?: string | null;
    isOnline?: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
}

export function ConversationList({ selectedId, onSelect, onNewChat }: ConversationListProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeUsers = useActiveList();

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/chat/private/conversations');
        const data = await res.json();
        if (data.conversations) setConversations(data.conversations);
      } catch (error) {
        console.error('Load conversations error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Real-time updates
  usePusher({
    channelName: session?.user?.id ? CHANNELS.user(session.user.id) : '',
    eventName: EVENTS.CONVERSATION_UPDATED,
    onEvent: (data) => {
      const update = data as {
        conversationId: string;
        lastMessage: string;
        lastMessageAt: string;
        senderId: string;
        senderName: string;
      };
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === update.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: update.lastMessage,
                  createdAt: update.lastMessageAt,
                  senderId: update.senderId,
                  isRead: false,
                },
                lastMessageAt: update.lastMessageAt,
                unreadCount: selectedId === update.conversationId ? 0 : c.unreadCount + 1,
              }
            : c
        );
        return updated.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
      });
    },
    enabled: !!session?.user?.id,
  });

  const filtered = conversations.filter((c) =>
    c.otherUser.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Messages</h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
            title="New conversation"
          >
            <MessageCirclePlus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl bg-muted/50 border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm px-4 text-center">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p>{search ? 'No matches found' : 'No conversations yet'}</p>
            <button onClick={onNewChat} className="text-primary text-xs mt-1 hover:underline">
              Start a conversation
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const avatarUrl = conv.otherUser.avatar || conv.otherUser.image;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                  selectedId === conv.id && 'bg-primary/5 border-r-2 border-r-primary'
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{getInitials(conv.otherUser.name)}</span>
                    )}
                  </div>
                  <OnlineIndicator
                    isOnline={activeUsers.has(conv.otherUser.id) || conv.otherUser.isOnline || false}
                    size="sm"
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm font-semibold truncate', conv.unreadCount > 0 && 'text-foreground')}>
                      {conv.otherUser.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn(
                      'text-xs truncate',
                      conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {conv.lastMessage?.content || 'Start chatting!'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
