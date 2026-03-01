'use client'
// src/app/(dashboard)/materials/shared-with-me/page.tsx
import { useState, useEffect } from 'react'
import { MaterialGrid } from '@/components/materials/material-grid'
import { MaterialListItem } from '@/components/materials/material-list-item'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

export default function SharedWithMePage() {
  const { data: session } = useSession()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShared = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/materials/shared-with-me')
        if (res.ok) {
          const data = await res.json()
          setShares(data.data.shares)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchShared()
  }, [])

  const materials = shares.map(s => ({
    ...s.material,
    sharedBy: s.sharedBy,
    canDownload: s.canDownload,
    canEdit: s.canEdit,
  }))

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold">Shared With Me</h1>
          <p className="text-sm text-muted-foreground">Study materials shared specifically with you</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search shared materials..." 
            className="pl-9 rounded-xl border-border bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button onClick={() => setView('grid')} className={cn('p-2', view === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-2', view === 'list' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        {view === 'grid' ? (
          <MaterialGrid
            materials={filteredMaterials}
            currentUserId={session?.user?.id}
            loading={loading}
            emptyTitle="Nothing shared yet"
            emptyDescription="When someone shares a private material with you, it will appear here."
          />
        ) : (
          <div className="space-y-2">
            {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />) :
              filteredMaterials.length === 0 ? <div className="text-center py-16 text-muted-foreground">Nothing shared yet</div> :
              filteredMaterials.map(m => (
                <MaterialListItem key={m.id} material={m} currentUserId={session?.user?.id} />
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
