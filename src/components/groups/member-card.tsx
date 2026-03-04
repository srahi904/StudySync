'use client'
// src/components/groups/member-card.tsx
import Image from 'next/image'
import { Crown, Shield, User } from 'lucide-react'
import { getInitials } from '@/lib/utils'

type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

const RoleIcon = ({ role }: { role: Role }) => {
  if (role === 'OWNER') return <Crown className="h-3.5 w-3.5 text-yellow-500" />
  if (role === 'ADMIN') return <Shield className="h-3.5 w-3.5 text-blue-400" />
  return <User className="h-3.5 w-3.5 text-muted-foreground" />
}

const roleLabel: Record<Role, string> = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' }
const roleBadge: Record<Role, string> = {
  OWNER: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  ADMIN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  MEMBER: 'bg-muted text-muted-foreground border-border/50',
}

interface MemberCardProps {
  member: {
    id: string; role: Role; joinedAt: string
    user: { id: string; name: string; email: string; avatar?: string; university?: string; major?: string }
  }
  actions?: React.ReactNode
  isCurrentUser?: boolean
}

export function MemberCard({ member, actions, isCurrentUser }: MemberCardProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border bg-card transition-colors ${isCurrentUser ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:border-border'}`}>
      <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
        {member.user.avatar ? (
          <Image src={member.user.avatar} alt={member.user.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm font-medium text-foreground">
            {getInitials(member.user.name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{member.user.name}</span>
          {isCurrentUser && <span className="text-xs text-muted-foreground">(you)</span>}
        </div>
        {member.user.university && (
          <p className="text-xs text-muted-foreground truncate">{member.user.university}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${roleBadge[member.role]}`}>
          <RoleIcon role={member.role} />
          {roleLabel[member.role]}
        </span>
        {actions}
      </div>
    </div>
  )
}
