'use client'
// src/components/groups/group-grid.tsx
import { GroupCard } from './group-card'

interface Group {
  id: string; name: string; description?: string; subject: string; tags: string[]
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; memberCount: number; materialCount: number
  maxMembers: number; avatar?: string; creator: { id: string; name: string; avatar?: string }
  isMember?: boolean; myRole?: string | null
}

interface GroupGridProps {
  groups: Group[]
  onJoin?: (groupId: string) => Promise<void>
  showActions?: boolean
  emptyMessage?: string
}

export function GroupGrid({ groups, onJoin, showActions = true, emptyMessage = 'No groups found' }: GroupGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-3xl">🏫</div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No groups yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map(group => (
        <GroupCard key={group.id} group={group} onJoin={onJoin} showActions={showActions} />
      ))}
    </div>
  )
}

// Skeleton loader for groups grid
export function GroupGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-muted animate-pulse mb-2" />
          <div className="h-3 w-2/3 rounded bg-muted animate-pulse mb-4" />
          <div className="h-8 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
