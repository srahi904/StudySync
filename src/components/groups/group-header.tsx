'use client'
// src/components/groups/group-header.tsx
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Users, Settings, LogOut, UserPlus, Loader2, ArrowLeft } from 'lucide-react'
import { PrivacyBadge } from './privacy-badge'
import { GroupStats } from './group-stats'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

interface GroupHeaderProps {
  group: {
    id: string; name: string; subject: string; description?: string
    privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; memberCount: number; materialCount: number; maxMembers: number
    avatar?: string; coverImage?: string
    creator: { id: string; name: string }
    hasPendingRequest?: boolean
  }
  myRole: Role | null
  onJoin?: () => Promise<void>
  onInvite?: () => void
  joinPending?: boolean
}

export function GroupHeader({ group, myRole, onJoin, onInvite, joinPending }: GroupHeaderProps) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    setLeaving(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/leave`, { method: 'POST' })
      const data = await res.json()
      if (data.success) { toast({ title: 'Left the group' }); router.push('/groups') }
      else toast({ title: data.message || 'Failed to leave', variant: "destructive" })
    } finally { setLeaving(false) }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent">
        {group.coverImage && (
          <Image src={group.coverImage} alt="cover" fill className="object-cover opacity-40" />
        )}
        <Link href="/groups" className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-black/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Groups
        </Link>
      </div>

      <div className="px-6 pb-6">
        {/* Avatar + Actions */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-card bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary shadow-lg">
            {group.avatar ? (
              <Image src={group.avatar} alt={group.name} width={80} height={80} className="object-cover" />
            ) : (
              <span>{getInitials(group.name)}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-8">
            {!myRole && (
              <button
                onClick={onJoin}
                disabled={joinPending || group.memberCount >= group.maxMembers || group.hasPendingRequest}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  group.hasPendingRequest
                    ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                }`}
              >
                {joinPending ? <Loader2 className="h-4 w-4 animate-spin" /> : group.hasPendingRequest ? null : <UserPlus className="h-4 w-4" />}
                {group.hasPendingRequest ? 'Request Pending' : group.privacy === 'PUBLIC' || group.privacy === 'INVITE_ONLY' ? 'Join Group' : 'Request to Join'}
              </button>
            )}
            {myRole && myRole !== 'OWNER' && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 text-muted-foreground text-sm hover:border-red-500/30 hover:text-red-400 transition-all"
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Leave
              </button>
            )}
            {myRole && (myRole === 'OWNER' || myRole === 'ADMIN') && (
              <>
                {onInvite && (
                  <button
                    onClick={onInvite}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                  >
                    <UserPlus className="h-4 w-4" /> Invite
                  </button>
                )}
                <Link
                  href={`/groups/${group.id}/settings`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:border-border transition-all"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <PrivacyBadge privacy={group.privacy} />
            {myRole && (
              <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {myRole === 'OWNER' ? '👑 Owner' : myRole === 'ADMIN' ? '🛡 Admin' : '✓ Member'}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{group.subject}</p>
          {group.description && <p className="text-sm text-foreground/80 mb-3">{group.description}</p>}
          <GroupStats memberCount={group.memberCount} maxMembers={group.maxMembers} materialCount={group.materialCount} />
        </div>
      </div>
    </div>
  )
}
