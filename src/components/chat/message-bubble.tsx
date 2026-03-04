// src/components/chat/message-bubble.tsx
'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string | null;
      image?: string | null;
    };
    status?: string;
    isRead?: boolean;
    createdAt: string;
    _sending?: boolean;
    _failed?: boolean;
  };
  isOwnMessage: boolean;
  showAvatar?: boolean;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = true, onDelete }: MessageBubbleProps) {
  const avatarUrl = message.sender.avatar || message.sender.image;

  return (
    <div
      className={cn(
        'flex gap-2 px-4 py-1 group',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{getInitials(message.sender.name)}</span>
          )}
        </div>
      )}
      {showAvatar && isOwnMessage && <div className="w-8 flex-shrink-0" />}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 relative shadow-sm z-10',
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted border border-border rounded-bl-sm',
          message._sending && 'opacity-70',
          message._failed && 'border border-destructive'
        )}
      >
        {/* Sender name (for public chat / non-own messages) */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs font-semibold mb-0.5 opacity-75">{message.sender.name}</p>
        )}

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Footer: time + status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}
        >
          <span className={cn('text-[10px]', isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
            {message._sending ? 'Sending...' : format(new Date(message.createdAt), 'h:mm a')}
          </span>

          {/* Status indicators */}
          {isOwnMessage && !message._sending && !message._failed && (
            <>
              {message.status === 'READ' || message.isRead ? (
                <CheckCheck className={cn('w-3 h-3', isOwnMessage ? 'text-blue-300' : 'text-blue-500')} />
              ) : message.status === 'DELIVERED' ? (
                <CheckCheck className={cn('w-3 h-3', isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground')} />
              ) : (
                <Check className={cn('w-3 h-3', isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground')} />
              )}
            </>
          )}

          {message._sending && <Loader2 className="w-3 h-3 animate-spin" />}
          {message._failed && <AlertCircle className="w-3 h-3 text-destructive" />}
        </div>
      </div>

      {/* Delete button (hover) */}
      {isOwnMessage && onDelete && !message._sending && (
        <button
          onClick={() => onDelete(message.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity self-center p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
