'use client';

import { FormEvent } from 'react';
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
  onSelectMaterials
}: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>✨</span> Study Assistant
        </h2>
        <MaterialSelector 
          selectedMaterials={selectedMaterials} 
          onSelectMaterials={onSelectMaterials} 
        />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
              🤖
            </div>
            <p className="text-sm">I'm ready to answer any questions about your documents.</p>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>
      
      {/* Input Form */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={onInputChange}
            placeholder={selectedMaterials.length > 0 ? "Ask about your study materials..." : "Chat with your AI Assistant..."}
            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors shadow-sm"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
