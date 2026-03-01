'use client'
// src/app/(dashboard)/materials/public/page.tsx - Browse Public Materials
import { useState } from 'react'
import { MaterialGrid } from '@/components/materials/material-grid'
import { MaterialSearch } from '@/components/materials/material-search'
import { MaterialFilters, DEFAULT_FILTERS, MaterialFiltersState } from '@/components/materials/material-filters'
import { useMaterials } from '@/lib/materials/use-materials'
import { Globe, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PublicMaterialsPage() {
  const [filters, setFilters] = useState<MaterialFiltersState>({ ...DEFAULT_FILTERS })
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const { materials, pagination, loading } = useMaterials({
    filters: { ...filters, isPublic: true },
    page,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-extrabold">Public Library</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total} public materials` : 'Browse community study materials'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <MaterialSearch className="flex-1" onSearch={setSearch} placeholder="Search public materials..." />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
            showFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground')}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <div className="hidden lg:block">
            <MaterialFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} totalCount={pagination?.total} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <MaterialGrid
            materials={materials}
            loading={loading}
            emptyTitle="No public materials"
            emptyDescription="No study materials have been shared publicly yet. Be the first!"
          />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasMore} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
