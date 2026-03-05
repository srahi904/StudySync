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
        'flex gap-2.5 px-4 py-0.5 group',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center mt-1">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{getInitials(message.sender.name)}</span>
          )}
        </div>
      )}
      {showAvatar && isOwnMessage && <div className="w-8 flex-shrink-0" />}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 relative flex flex-col',
          isOwnMessage
            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-br-sm'
            : 'bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-bl-sm shadow-sm',
          message._sending && 'opacity-60',
          message._failed && 'ring-1 ring-destructive/50'
        )}
      >
        {/* Sender name */}
        {!isOwnMessage && showAvatar && (
          <p className="text-[11px] font-semibold text-[#53bdeb] dark:text-[#53bdeb] mb-0.5">{message.sender.name}</p>
        )}

        {/* Content */}
        <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>

        {/* Footer */}
        <div className="flex items-center gap-1 mt-1 self-end text-[#667781] dark:text-[#8696a0]">
          <span className="text-[10px] font-medium">
            {message._sending ? 'Sending...' : format(new Date(message.createdAt), 'h:mm a')}
          </span>

          {isOwnMessage && !message._sending && !message._failed && (
            <>
              {message.status === 'READ' || message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-primary/70" />
              ) : message.status === 'DELIVERED' ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
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
