'use client'
// src/components/groups/invitation-card.tsx
import Image from 'next/image'
import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { PrivacyBadge } from './privacy-badge'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'

interface InvitationCardProps {
  invitation: {
    id: string; createdAt: string
    group: { id: string; name: string; subject: string; memberCount: number; privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; avatar?: string }
    inviter: { id: string; name: string; avatar?: string }
  }
  onHandled?: () => void
}

export function InvitationCard({ invitation, onHandled }: InvitationCardProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const router = useRouter()

  const handle = async (action: 'accept' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/groups/invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: action === 'accept' ? `Joined "${invitation.group.name}"!` : 'Invitation declined' })
        if (action === 'accept') router.push(`/groups/${invitation.group.id}`)
        onHandled?.()
      } else toast({ title: data.message || 'Failed', variant: "destructive" })
    } finally { setLoading(null) }
  }

  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
      <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-border/50 flex-shrink-0">
        {invitation.group.avatar ? (
          <Image src={invitation.group.avatar} alt={invitation.group.name} width={48} height={48} className="object-cover" />
        ) : (
          <span>{getInitials(invitation.group.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground">{invitation.group.name}</h3>
          <PrivacyBadge privacy={invitation.group.privacy} />
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{invitation.group.subject}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Invited by <span className="text-foreground font-medium">{invitation.inviter.name}</span> · {format(new Date(invitation.createdAt), 'MMM d')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => handle('accept')}
          disabled={!!loading}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {loading === 'accept' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Accept
        </button>
        <button
          onClick={() => handle('reject')}
          disabled={!!loading}
          className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
        >
          {loading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
