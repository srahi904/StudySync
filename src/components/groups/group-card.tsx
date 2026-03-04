'use client'
// src/components/groups/group-card.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Users, BookOpen, ArrowRight, Loader2, Lock } from 'lucide-react'
import { PrivacyBadge } from './privacy-badge'
import { getInitials } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface GroupCardProps {
  group: {
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
    creator: { id: string; name: string; avatar?: string }
    isMember?: boolean
    myRole?: string | null
    hasPendingRequest?: boolean
  }
  onJoin?: (groupId: string) => Promise<void>
  showActions?: boolean
}

export function GroupCard({ group, onJoin, showActions = true }: GroupCardProps) {
  const { data: session } = useSession()
  const [joining, setJoining] = useState(false)
  const isFull = group.memberCount >= group.maxMembers

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onJoin || joining || group.hasPendingRequest || group.privacy === 'INVITE_ONLY') return
    setJoining(true)
    try { await onJoin(group.id) } finally { setJoining(false) }
  }

  return (
    <Link href={`/groups/${group.id}`} className="group block">
      <div className="h-full rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg border border-border/50">
            {group.avatar ? (
              <Image src={group.avatar} alt={group.name} fill className="object-cover" />
            ) : (
              <span>{getInitials(group.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{group.subject}</p>
          </div>
          <PrivacyBadge privacy={group.privacy} />
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
        )}

        {/* Tags */}
        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {group.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                #{tag}
              </span>
            ))}
            {group.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{group.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {group.memberCount}/{group.maxMembers}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {group.materialCount} materials
          </span>
        </div>

        {/* Action */}
        {showActions && session && !group.myRole && (
          <button
            onClick={handleJoin}
            disabled={joining || isFull || group.hasPendingRequest}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isFull || group.privacy === 'INVITE_ONLY' || group.hasPendingRequest
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {joining ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFull ? (
              'Full'
            ) : group.hasPendingRequest ? (
              <>Request Pending</>
            ) : group.privacy === 'INVITE_ONLY' ? (
              <><Lock className="h-3.5 w-3.5" /> Invite Only</>
            ) : group.privacy === 'PRIVATE' ? (
              <><Lock className="h-3.5 w-3.5" /> Request to Join</>
            ) : (
              <>Join <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </button>
        )}

        {group.myRole && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-medium capitalize">
              {group.myRole === 'OWNER' ? '👑 Owner' : group.myRole === 'ADMIN' ? '🛡 Admin' : '✓ Member'}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
      </div>
    </Link>
  )
}
