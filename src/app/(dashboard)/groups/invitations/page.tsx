'use client'
// src/app/(dashboard)/groups/invitations/page.tsx
import { useState, useEffect } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { InvitationCard } from '@/components/groups/invitation-card'

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = () => {
    fetch('/api/groups/invitations').then(r => r.json()).then(d => {
      if (d.success) setInvitations(d.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchInvitations() }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Group Invitations</h1>
          <p className="text-sm text-muted-foreground">Accept or decline invitations to study groups</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-1">No pending invitations</h3>
          <p className="text-sm text-muted-foreground">When someone invites you to a group, it'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map(inv => (
            <InvitationCard key={inv.id} invitation={inv} onHandled={fetchInvitations} />
          ))}
        </div>
      )}
    </div>
  )
}
