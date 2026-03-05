'use client'
// src/components/groups/group-chat.tsx
import { useState, useEffect, useRef } from 'react'
import { useGroupChat } from '@/hooks/use-group-chat'
import { Send, Loader2, ArrowUp } from 'lucide-react'
import Image from 'next/image'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'

interface GroupChatProps {
  groupId: string
  currentUserId: string
  currentUserAvatar?: string
  currentUserName?: string
}

export function GroupChat({ groupId, currentUserId, currentUserAvatar, currentUserName }: GroupChatProps) {
  const { messages, loading, nextCursor, sendMessage, loadMore } = useGroupChat(groupId, currentUserId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setInput('')
    try { await sendMessage(input.trim()) } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nextCursor && (
          <button onClick={() => loadMore?.()} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2">
            <ArrowUp className="h-3 w-3" /> Load older messages
          </button>
        )}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender.id === currentUserId
            const showAvatar = !isOwn && (idx === 0 || messages[idx - 1].sender.id !== msg.sender.id)
            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border border-border/50 flex-shrink-0 mt-1">
                    {msg.sender.avatar ? (
                      <Image src={msg.sender.avatar} alt={msg.sender.name} width={32} height={32} className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-medium">{getInitials(msg.sender.name)}</div>
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showAvatar && !isOwn && (
                    <span className="text-[11px] font-semibold text-muted-foreground px-2 mb-1 tracking-wide">{msg.sender.name}</span>
                  )}
                  <div className={`relative px-3.5 py-2 rounded-2xl flex flex-col ${
                    isOwn
                      ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-br-sm'
                      : 'bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-bl-sm shadow-sm'
                  }`}>
                    <span className="text-[14px] break-words whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                    <span className="text-[10px] mt-1 self-end font-medium text-[#667781] dark:text-[#8696a0]">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-3 bg-card">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-muted/50 dark:bg-muted/30 rounded-full px-4 h-11 border border-border/30 focus-within:border-primary/30 transition-colors">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
