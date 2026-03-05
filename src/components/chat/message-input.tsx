// src/components/chat/message-input.tsx
'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Smile, Plus, X, Lock } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [content, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleInput = () => {
    onTyping?.();
  };

  return (
    <div className={cn('px-4 py-3 bg-card border-t border-border/50', className)}>
      <div className="flex items-center gap-2">
        {/* Attach */}
        <button
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          title="Add attachment"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Input */}
        <div className="flex-1 flex items-center bg-muted/50 dark:bg-muted/30 rounded-full px-4 h-11 border border-border/30 focus-within:border-primary/30 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="ml-2 text-muted-foreground/60 hover:text-foreground transition-colors flex-shrink-0"
            title="Emoji"
          >
            {showEmoji ? <X className="w-[18px] h-[18px]" /> : <Smile className="w-[18px] h-[18px]" />}
          </button>
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all',
            content.trim() && !disabled
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'text-muted-foreground/40 cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground/40">
        <Lock className="w-2.5 h-2.5" />
        <span>End-to-end encrypted</span>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border border-border/30 rounded-xl max-h-28 overflow-y-auto">
            {['😀', '😂', '😍', '🤔', '👍', '👋', '🎉', '🔥', '❤️', '💯',
              '😊', '😎', '🤝', '💪', '📚', '✨', '🚀', '💡', '👏', '🙏',
              '😅', '🤣', '😢', '😤', '🥳', '🤯', '😱', '🤗', '🫡', '✅'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-lg transition-colors text-base"
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
