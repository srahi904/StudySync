'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

export function ConversationList({ 
  onSelectConversation, 
  currentConversationId 
}: { 
  onSelectConversation: (id: string | null) => void,
  currentConversationId: string | null
}) {
  const [conversations, setConversations] = useState<any[]>([]);

  const fetchConversations = () => {
    fetch('/api/ai/conversations')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setConversations(data) : [])
      .catch(() => setConversations([]));
  };

  useEffect(() => {
    fetchConversations();
  }, [currentConversationId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentConversationId === id) {
          onSelectConversation(null); // Clear selected chat if deleted
        } else {
          fetchConversations(); // Refresh list
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 shadow-inner">
      <button 
        onClick={() => onSelectConversation(null)}
        className="mb-4 flex items-center justify-center gap-2 p-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors w-full shadow-md active:scale-95"
      >
        <span>+</span> New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 px-2 py-1 tracking-widest uppercase">History</h3>
        {conversations.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 px-2 italic">Nothing here yet</p>
        ) : (
          conversations.map(conv => (
            <div 
              key={conv.id} 
              className={`flex items-center justify-between group rounded-lg transition-all ${
                currentConversationId === conv.id 
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800 font-medium' 
                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className="flex-1 text-left truncate text-sm px-3 py-2 w-full"
              >
                {conv.title}
              </button>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className={`p-2 text-slate-400 hover:text-red-500 transition-colors ${currentConversationId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
