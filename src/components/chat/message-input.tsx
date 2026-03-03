// src/components/chat/message-input.tsx
'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string, attachments?: unknown) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({ onSend, onTyping, disabled, placeholder = 'Type a message...', className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [content, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    onTyping?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('border-t border-border bg-card/50 backdrop-blur-sm', className)}>
      <div className="flex items-end gap-2 p-3">
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
          title="Emoji"
        >
          {showEmoji ? <X className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-2xl bg-muted/50 border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50 max-h-32 transition-all disabled:opacity-50"
            style={{ minHeight: '42px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={cn(
            'p-2.5 rounded-full transition-all flex-shrink-0',
            content.trim() && !disabled
              ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-xl max-h-32 overflow-y-auto">
            {['😀', '😂', '😍', '🤔', '👍', '👋', '🎉', '🔥', '❤️', '💯',
              '😊', '😎', '🤝', '💪', '📚', '✨', '🚀', '💡', '👏', '🙏',
              '😅', '🤣', '😢', '😤', '🥳', '🤯', '😱', '🤗', '🫡', '✅'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
