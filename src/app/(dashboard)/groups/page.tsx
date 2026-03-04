'use client'
// src/app/(dashboard)/groups/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Compass, Mail, Users, BookOpen } from 'lucide-react'
import { GroupGrid, GroupGridSkeleton } from '@/components/groups/group-grid'
import { toast } from '@/components/ui/use-toast'

export default function GroupsPage() {
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteCount, setInviteCount] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/groups').then(r => r.json()),
      fetch('/api/groups/invitations').then(r => r.json()),
    ]).then(([gData, iData]) => {
      if (gData.success) setMemberships(gData.data)
      if (iData.success) setInviteCount(iData.data.length)
    }).finally(() => setLoading(false))
  }, [])

  const groups = memberships.map(m => ({
    ...m.group,
    myRole: m.role,
    isMember: true,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Groups</h1>
          <p className="text-muted-foreground mt-1">Collaborate, share, and learn together</p>
        </div>
        <div className="flex items-center gap-3">
          {inviteCount > 0 && (
            <Link href="/groups/invitations" className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all">
              <Mail className="h-4 w-4" />
              Invitations
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{inviteCount}</span>
            </Link>
          )}
          <Link href="/groups/discover" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium hover:border-primary/30 hover:text-primary transition-all">
            <Compass className="h-4 w-4" /> Discover
          </Link>
          <Link href="/groups/create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
            <Plus className="h-4 w-4" /> Create Group
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Groups Joined', value: groups.length, icon: <Users className="h-5 w-5 text-primary" /> },
            { label: 'Groups Owned', value: groups.filter(g => g.myRole === 'OWNER').length, icon: <span className="text-xl">👑</span> },
            { label: 'Admin In', value: groups.filter(g => g.myRole === 'ADMIN').length, icon: <span className="text-xl">🛡</span> },
            { label: 'Total Materials', value: groups.reduce((acc, g) => acc + (g.materialCount || 0), 0), icon: <BookOpen className="h-5 w-5 text-primary" /> },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Grid */}
      {loading ? (
        <GroupGridSkeleton />
      ) : (
        <GroupGrid
          groups={groups}
          showActions={false}
          emptyMessage="You haven't joined any groups yet. Discover groups or create one!"
        />
      )}
    </div>
  )
}
