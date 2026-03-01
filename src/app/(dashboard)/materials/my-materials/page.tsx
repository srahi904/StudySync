'use client'
// src/app/(dashboard)/materials/my-materials/page.tsx
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialGrid } from '@/components/materials/material-grid'
import { MaterialListItem } from '@/components/materials/material-list-item'
import { MaterialFilters, DEFAULT_FILTERS, MaterialFiltersState } from '@/components/materials/material-filters'
import { MaterialSearch } from '@/components/materials/material-search'
import { DeleteModal } from '@/components/materials/delete-modal'
import { useToast } from '@/components/ui/use-toast'
import { useMaterials } from '@/lib/materials/use-materials'
import { cn } from '@/lib/utils'

export default function MyMaterialsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<MaterialFiltersState>(DEFAULT_FILTERS)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [page, setPage] = useState(1)

  const { materials, pagination, loading, reload } = useMaterials({
    filters,
    page,
    limit: 20,
    userId: session?.user?.id,
  })

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Deleted' })
      setDeleteTarget(null)
      reload()
    } else {
      toast({ title: 'Delete failed', variant: 'destructive' as any })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold">My Materials</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total} materials` : 'Your personal study library'}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/materials/upload"><Upload className="w-4 h-4" /> Upload</Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <MaterialSearch onSearch={(q) => {}} className="flex-1" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
            showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button onClick={() => setView('grid')} className={cn('p-2', view === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-2', view === 'list' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="hidden lg:block">
            <MaterialFilters
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1) }}
              showStatusFilter
              showVisibilityFilter
              totalCount={pagination?.total}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {view === 'grid' ? (
            <MaterialGrid
              materials={materials}
              currentUserId={session?.user?.id}
              onDelete={(id) => { const m = materials.find(x => x.id === id); if (m) setDeleteTarget({ id, title: m.title }) }}
              loading={loading}
              showStatus
              emptyTitle="No materials yet"
              emptyDescription="Upload your first study material to get started"
            />
          ) : (
            <div className="space-y-2">
              {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />) :
               materials.length === 0 ? <div className="text-center py-16 text-muted-foreground">No materials yet</div> :
               materials.map(m => (
                 <MaterialListItem key={m.id} material={m} currentUserId={session?.user?.id}
                   onDelete={(id) => { const mat = materials.find(x => x.id === id); if (mat) setDeleteTarget({ id, title: mat.title }) }}
                   showStatus
                 />
               ))
              }
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasMore} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>

      <DeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget!.id)} materialTitle={deleteTarget?.title || ''} />
    </div>
  )
}
