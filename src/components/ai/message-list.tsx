'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function parseSources(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function MessageList({
  messages,
  isLoading,
}: {
  messages: any[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      {messages.map((m, index) => {
        const isUser = m.role === 'user';
        const sources = !isUser ? parseSources(m.sources) : [];

        return (
          <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow ${
                isUser
                  ? 'rounded-br-sm bg-blue-600 text-white'
                  : 'rounded-bl-sm border border-border bg-card text-foreground'
              }`}
            >
              <div
                className={`prose prose-sm max-w-none ${
                  isUser
                    ? 'prose-p:text-white prose-strong:text-white prose-headings:text-white'
                    : 'prose-invert'
                }`}
              >
                {/* @ts-ignore */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>

              {!isUser && sources.length > 0 && (
                <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold text-foreground">Sources</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {sources.map((source: any, i: number) => (
                      <li key={i}>
                        Segment {i + 1}
                        {typeof source.similarity === 'number'
                          ? ` · ${(source.similarity * 100).toFixed(1)}% match`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
            <div className="flex h-4 items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
