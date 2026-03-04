'use client'
// src/components/groups/member-actions.tsx
import { useState } from 'react'
import { MoreVertical, Shield, UserMinus, User, Loader2 } from 'lucide-react'

type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

interface MemberActionsProps {
  targetUserId: string
  targetRole: Role
  actorRole: Role
  groupId: string
  onRoleChange?: () => void
}

export function MemberActions({ targetUserId, targetRole, actorRole, groupId, onRoleChange }: MemberActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  if (targetRole === 'OWNER') return null
  const canPromoteAdmin = actorRole === 'OWNER' && targetRole === 'MEMBER'
  const canDemoteAdmin = actorRole === 'OWNER' && targetRole === 'ADMIN'
  const canRemove = actorRole === 'OWNER' || (actorRole === 'ADMIN' && targetRole === 'MEMBER')

  if (!canPromoteAdmin && !canDemoteAdmin && !canRemove) return null

  const doAction = async (action: 'promote' | 'demote' | 'remove') => {
    setLoading(action)
    setOpen(false)
    try {
      if (action === 'remove') {
        await fetch(`/api/groups/${groupId}/members/${targetUserId}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/groups/${groupId}/members/${targetUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: action === 'promote' ? 'ADMIN' : 'MEMBER' }),
        })
      }
      onRoleChange?.()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <MoreVertical className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border/50 bg-card shadow-xl py-1">
            {canPromoteAdmin && (
              <button onClick={() => doAction('promote')} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-blue-400">
                <Shield className="h-3.5 w-3.5" /> Promote to Admin
              </button>
            )}
            {canDemoteAdmin && (
              <button onClick={() => doAction('demote')} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Demote to Member
              </button>
            )}
            {canRemove && (
              <button onClick={() => doAction('remove')} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-red-400">
                <UserMinus className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
