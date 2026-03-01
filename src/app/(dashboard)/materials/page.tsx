'use client'
// src/app/(dashboard)/materials/page.tsx - Main Materials Library
import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialSearch } from '@/components/materials/material-search'
import { DEFAULT_FILTERS, MaterialFiltersState } from '@/components/materials/material-filters'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useMaterials } from '@/lib/materials/use-materials'
import dynamic from 'next/dynamic'

const MaterialGrid = dynamic(() => import('@/components/materials/material-grid').then(m => m.MaterialGrid))
const MaterialListItem = dynamic(() => import('@/components/materials/material-list-item').then(m => m.MaterialListItem))
const MaterialFilters = dynamic(() => import('@/components/materials/material-filters').then(m => m.MaterialFilters))
const DeleteModal = dynamic(() => import('@/components/materials/delete-modal').then(m => m.DeleteModal))

export default function MaterialsPage() {
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
  })

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Material deleted' })
      setDeleteTarget(null)
      reload()
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' as any })
    }
  }

  const handleFiltersChange = (newFilters: MaterialFiltersState) => {
    setFilters(newFilters)
    setPage(1)
  }

  const activeFilterCount = filters.types.length + filters.subjects.length + filters.statuses.length +
    (filters.isPublic !== undefined ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold">Materials Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination ? `${pagination.total} study materials` : 'Your study materials'}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/materials/upload">
            <Upload className="w-4 h-4" />
            Upload Material
          </Link>
        </Button>
      </div>

      {/* Search + View Controls */}
      <div className="flex items-center gap-3">
        <MaterialSearch
          value={filters.sortBy}
          onSearch={(q) => handleFiltersChange({ ...filters })}
          className="flex-1"
          placeholder="Search materials by title, subject, tags..."
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
            showFilters
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={cn('p-2 transition-colors', view === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('p-2 transition-colors', view === 'list' ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map(t => (
            <span key={t} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
              {t}
              <button onClick={() => handleFiltersChange({ ...filters, types: filters.types.filter(x => x !== t) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.subjects.map(s => (
            <span key={s} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
              {s}
              <button onClick={() => handleFiltersChange({ ...filters, subjects: filters.subjects.filter(x => x !== s) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="hidden lg:block">
            <MaterialFilters
              filters={filters}
              onChange={handleFiltersChange}
              totalCount={pagination?.total}
            />
          </div>
        )}

        {/* Materials */}
        <div className="flex-1 min-w-0">
          {view === 'grid' ? (
            <MaterialGrid
              materials={materials}
              currentUserId={session?.user?.id}
              onDelete={(id) => {
                const mat = materials.find(m => m.id === id)
                if (mat) setDeleteTarget({ id, title: mat.title })
              }}
              loading={loading}
              emptyTitle="No materials found"
              emptyDescription="Upload your first study material or adjust your filters"
            />
          ) : (
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse border border-border" />
                ))
              ) : materials.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">No materials found</div>
              ) : (
                materials.map(m => (
                  <MaterialListItem
                    key={m.id}
                    material={m}
                    currentUserId={session?.user?.id}
                    onDelete={(id) => {
                      const mat = materials.find(x => x.id === id)
                      if (mat) setDeleteTarget({ id, title: mat.title })
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasMore}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget!.id)}
        materialTitle={deleteTarget?.title || ''}
      />
    </div>
  )
}
