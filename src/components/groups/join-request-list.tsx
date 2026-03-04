'use client'
// src/components/groups/join-request-list.tsx
import { useState } from 'react'
import Image from 'next/image'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'

interface JoinRequest {
  id: string; message?: string; createdAt: string
  user: { id: string; name: string; avatar?: string; university?: string; major?: string }
}

interface JoinRequestListProps {
  requests: JoinRequest[]
  groupId: string
  onRefresh?: () => void
}

export function JoinRequestList({ requests, groupId, onRefresh }: JoinRequestListProps) {
  const [loading, setLoading] = useState<{ id: string; action: string } | null>(null)

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading({ id: requestId, action })
    try {
      const res = await fetch(`/api/groups/${groupId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) { toast({ title: action === 'approve' ? 'Request approved!' : 'Request rejected' }); onRefresh?.() }
      else toast({ title: data.message || 'Action failed', variant: "destructive" })
    } finally { setLoading(null) }
  }

  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-10 text-sm">No pending join requests</p>
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border/50 flex-shrink-0">
            {req.user.avatar ? (
              <Image src={req.user.avatar} alt={req.user.name} width={40} height={40} className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-medium">{getInitials(req.user.name)}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{req.user.name}</p>
            {req.user.university && <p className="text-xs text-muted-foreground">{req.user.university}</p>}
            {req.message && <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>}
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(req.createdAt), 'MMM d, h:mm a')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleAction(req.id, 'approve')}
              disabled={!!loading}
              className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              {loading?.id === req.id && loading.action === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleAction(req.id, 'reject')}
              disabled={!!loading}
              className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
            >
              {loading?.id === req.id && loading.action === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
