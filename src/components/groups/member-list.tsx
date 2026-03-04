'use client'
// src/components/groups/member-list.tsx
import { MemberCard } from './member-card'
import { MemberActions } from './member-actions'

type Role = 'OWNER' | 'ADMIN' | 'MEMBER'

interface Member {
  id: string; role: Role; joinedAt: string
  user: { id: string; name: string; email: string; avatar?: string; university?: string; major?: string }
}

interface MemberListProps {
  members: Member[]
  currentUserId: string
  currentUserRole: Role | null
  groupId: string
  onRefresh?: () => void
}

export function MemberList({ members, currentUserId, currentUserRole, groupId, onRefresh }: MemberListProps) {
  if (members.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No members found</p>
  }

  return (
    <div className="space-y-2">
      {members.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          isCurrentUser={member.user.id === currentUserId}
          actions={
            currentUserRole && member.user.id !== currentUserId ? (
              <MemberActions
                targetUserId={member.user.id}
                targetRole={member.role}
                actorRole={currentUserRole}
                groupId={groupId}
                onRoleChange={onRefresh}
              />
            ) : undefined
          }
        />
      ))}
    </div>
  )
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse mb-2" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
