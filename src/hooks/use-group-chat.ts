// src/hooks/use-group-chat.ts
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

export interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: { id: string; name: string; avatar?: string }
}

export function useGroupChat(groupId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const pusherRef = useRef<Pusher | null>(null)

  const fetchMessages = useCallback(async (cursor?: string) => {
    if (!groupId) return
    try {
      const url = `/api/groups/${groupId}/chat${cursor ? `?cursor=${cursor}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        if (cursor) {
          setMessages(prev => [...data.data, ...prev])
        } else {
          setMessages(data.data)
        }
        setNextCursor(data.nextCursor)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const sendMessage = useCallback(async (content: string) => {
    if (!groupId || !content.trim()) return
    const res = await fetch(`/api/groups/${groupId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return res.json()
  }, [groupId])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  // Subscribe to Pusher
  useEffect(() => {
    if (!groupId || !userId) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    })
    pusherRef.current = pusher

    const channel = pusher.subscribe(CHANNELS.group(groupId))
    channel.bind(EVENTS.GROUP_CHAT_MESSAGE, (data: { message: ChatMessage }) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(CHANNELS.group(groupId))
      pusher.disconnect()
    }
  }, [groupId, userId])

  return { messages, loading, nextCursor, sendMessage, loadMore: () => nextCursor && fetchMessages(nextCursor) }
}
