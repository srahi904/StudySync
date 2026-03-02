'use client';

import { FormEvent } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { MessageList } from './message-list';
import { MaterialSelector } from './material-selector';

interface ChatInterfaceProps {
  messages: any[];
  input: string;
  onInputChange: (e: any) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  selectedMaterials: string[];
  onSelectMaterials: (ids: string[]) => void;
}

export function ChatInterface({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  selectedMaterials,
  onSelectMaterials,
}: ChatInterfaceProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Study Assistant
        </h2>
        <MaterialSelector
          selectedMaterials={selectedMaterials}
          onSelectMaterials={onSelectMaterials}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-background/40 px-4 py-5 md:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-xl font-medium text-foreground">Ask about your materials</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Select one or more study documents from Context and ask detailed questions.
              Responses will reference the selected content.
            </p>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className="border-t border-border bg-card p-4">
        <form onSubmit={onSubmit} className="flex items-center gap-3">
          <input
            value={input}
            onChange={onInputChange}
            placeholder={
              selectedMaterials.length > 0
                ? 'Ask about your selected study materials...'
                : 'Select Context first, then ask your question...'
            }
            className="h-14 flex-1 rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex h-14 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
