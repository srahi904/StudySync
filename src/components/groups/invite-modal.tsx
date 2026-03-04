'use client'
// src/components/groups/invite-modal.tsx
import { useState, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { getInitials } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface User { id: string; name: string; avatar?: string; university?: string }

export function InviteModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [invited, setInvited] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
        const data = await res.json()
        setUsers(data.data?.users || [])
      } finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) { toast({ title: 'Invitation sent!' }); setInvited(s => new Set([...s, userId])) }
      else toast({ title: data.message || 'Failed to invite', variant: "destructive" })
    } finally { setInviting(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border/50 bg-card shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-lg font-semibold">Invite Members</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for users to invite..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:border-primary/50"
              autoFocus
            />
          </div>
          <div className="min-h-[200px] space-y-2">
            {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
            {!loading && users.length === 0 && query && (
              <p className="text-center text-sm text-muted-foreground py-6">No users found</p>
            )}
            {!loading && !query && (
              <p className="text-center text-sm text-muted-foreground py-6">Start typing to search for users</p>
            )}
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                  {u.avatar ? (
                    <Image src={u.avatar} alt={u.name} width={36} height={36} className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-medium">{getInitials(u.name)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  {u.university && <p className="text-xs text-muted-foreground truncate">{u.university}</p>}
                </div>
                <button
                  onClick={() => handleInvite(u.id)}
                  disabled={!!inviting || invited.has(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    invited.has(u.id) ? 'bg-emerald-500/15 text-emerald-400 cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                  }`}
                >
                  {inviting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : invited.has(u.id) ? '✓ Invited' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
