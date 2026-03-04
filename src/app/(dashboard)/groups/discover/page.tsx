'use client'
// src/app/(dashboard)/groups/discover/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { Search, Filter } from 'lucide-react'
import { GroupGrid, GroupGridSkeleton } from '@/components/groups/group-grid'
import { toast } from '@/components/ui/use-toast'

const SUBJECTS = [
  'All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Engineering', 'Medicine', 'Law', 'Business', 'Economics', 'Other'
]

export default function DiscoverGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchGroups = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (subject !== 'All') params.set('subject', subject)
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`/api/groups/discover?${params}`)
    const data = await res.json()
    return data
  }, [search, subject])

  useEffect(() => {
    let active = true
    setLoading(true)
    const t = setTimeout(() => {
      fetchGroups().then(data => {
        if (!active) return
        if (data.success) { setGroups(data.data); setNextCursor(data.nextCursor) }
      }).finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [fetchGroups])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchGroups(nextCursor)
      if (data.success) { setGroups(prev => [...prev, ...data.data]); setNextCursor(data.nextCursor) }
    } finally { setLoadingMore(false) }
  }

  const handleJoin = async (groupId: string) => {
    const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const data = await res.json()
    if (data.success) {
      toast({ title: data.message || 'Joined!' })
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: true, myRole: 'MEMBER' } : g))
    } else {
      toast({ title: data.message || 'Failed', variant: "destructive" })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Discover Groups</h1>
        <p className="text-muted-foreground mt-1">Find study groups that match your interests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups by name, description, or tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-border/50 bg-muted/30 text-sm focus:border-primary/50 focus:outline-none appearance-none w-full sm:w-auto"
          >
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <GroupGridSkeleton />
      ) : (
        <>
          <GroupGrid groups={groups} onJoin={handleJoin} emptyMessage="No groups match your criteria. Try different filters or create one!" />
          {nextCursor && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl border border-border/50 text-sm font-medium hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
