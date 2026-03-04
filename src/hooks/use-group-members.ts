// src/hooks/use-group-members.ts
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Pusher from 'pusher-js'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

export interface GroupMemberInfo {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: { id: string; name: string; email: string; avatar?: string; university?: string; major?: string }
}

export function useGroupMembers(groupId: string, authSession: { user: { id: string } } | null) {
  const [members, setMembers] = useState<GroupMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const pusherRef = useRef<Pusher | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/groups/${groupId}/members`)
      const data = await res.json()
      if (data.success) setMembers(data.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Subscribe to Pusher for real-time member updates
  useEffect(() => {
    if (!groupId || !authSession?.user?.id) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    })
    pusherRef.current = pusher

    const channel = pusher.subscribe(CHANNELS.group(groupId))

    channel.bind(EVENTS.GROUP_MEMBER_JOINED, () => { fetchMembers() })
    channel.bind(EVENTS.GROUP_MEMBER_LEFT, () => { fetchMembers() })
    channel.bind(EVENTS.GROUP_MEMBER_UPDATED, () => { fetchMembers() })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(CHANNELS.group(groupId))
      pusher.disconnect()
    }
  }, [groupId, authSession?.user?.id, fetchMembers])

  return { members, loading, refetch: fetchMembers }
}
