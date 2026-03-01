'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageList({ messages, isLoading }: { messages: any[], isLoading: boolean }) {
  return (
    <>
      {messages.map((m, index) => (
        <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
            m.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
          }`}>
            <div className={`prose dark:prose-invert prose-sm max-w-none ${m.role === 'user' ? 'prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-blue-200' : ''}`}>
              {/* @ts-ignore - ReactMarkdown types are mismatched in this particular version */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
            
            {/* Source citations render if available from backend JSON */}
            {m.role !== 'user' && m.sources && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500">
                <span className="font-semibold block mb-1">Sources utilized:</span>
                <ul className="list-disc pl-4 opacity-80 space-y-1">
                  {/* Safely parse sources if it's a JSON string */}
                  {(typeof m.sources === 'string' ? JSON.parse(m.sources) : m.sources).map((source: any, i: number) => (
                    <li key={i}>Document Segment {i + 1} • {(source.similarity * 100).toFixed(1)}% match</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl p-4 bg-white dark:bg-slate-800 border rounded-bl-sm shadow-sm">
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
