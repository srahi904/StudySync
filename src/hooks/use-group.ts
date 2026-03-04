// src/hooks/use-group.ts
'use client'
import { useState, useEffect, useCallback } from 'react'

export interface GroupDetail {
  id: string
  name: string
  description?: string
  subject: string
  tags: string[]
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
  memberCount: number
  materialCount: number
  maxMembers: number
  avatar?: string
  createdAt: string
  creator: { id: string; name: string; avatar?: string }
  myMembership: { role: 'OWNER' | 'ADMIN' | 'MEMBER'; joinedAt: string } | null
  _count: { members: number; materials: number }
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroup = useCallback(async () => {
    if (!groupId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/groups/${groupId}`)
      const data = await res.json()
      if (data.success) setGroup(data.data)
      else setError(data.message)
    } catch {
      setError('Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { fetchGroup() }, [fetchGroup])

  return { group, loading, error, refetch: fetchGroup }
}
