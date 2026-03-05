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
    username?: string | null;
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl tracking-tight text-foreground">Chats</h2>
          <button
            onClick={onNewChat}
            className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="New conversation"
          >
            <MessageCirclePlus className="w-5 h-5" />
          </button>
        </div>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl bg-muted/60 border-transparent pl-10 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/70 transition-all font-medium"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
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
            const isSelected = selectedId === conv.id;
            const isOnline = activeUsers.has(conv.otherUser.id);
            const avatarUrl = conv.otherUser.avatar || conv.otherUser.image;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 relative overflow-hidden group',
                  isSelected
                    ? 'bg-muted/80 shadow-sm'
                    : 'hover:bg-muted/50'
                )}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                )}

                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{getInitials(conv.otherUser.name)}</span>
                    )}
                  </div>
                  <OnlineIndicator
                    isOnline={isOnline || false}
                    size="sm"
                    className="absolute bottom-0 right-0 border-2 border-background"
                  />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={cn(
                      'font-semibold text-[14px] truncate tracking-tight',
                      isSelected ? 'text-primary' : 'text-foreground hover:text-primary transition-colors'
                    )}>
                      {conv.otherUser.name}
                    </p>
                    <span className={cn(
                      'text-[11px] font-medium flex-shrink-0 ml-2',
                      conv.unreadCount > 0 ? 'text-primary' : 'text-muted-foreground/80'
                    )}>
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={cn(
                      'text-[13px] truncate',
                      conv.unreadCount > 0
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground/80'
                    )}>
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.senderId === session?.user?.id ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </>
                      ) : (
                        <span className="italic opacity-60">Start a conversation</span>
                      )}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5 flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    ) : (
                      isSelected && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-sm" />
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
