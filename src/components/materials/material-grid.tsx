'use client'
// src/components/materials/material-grid.tsx
import { Material, User } from '@prisma/client'
import { MaterialCard } from './material-card'
import { EmptyState } from './empty-state'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type MaterialWithUser = Material & { user?: Pick<User, 'id' | 'name' | 'avatar' | 'image'> }

interface MaterialGridProps {
  materials: MaterialWithUser[]
  currentUserId?: string
  onDelete?: (id: string) => void
  loading?: boolean
  showStatus?: boolean
  className?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function MaterialGrid({
  materials,
  currentUserId,
  onDelete,
  loading = false,
  showStatus = false,
  className,
  emptyTitle,
  emptyDescription,
}: MaterialGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-muted/30 animate-pulse">
            <div className="h-44 bg-muted rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-muted rounded-lg w-1/3" />
              <div className="h-4 bg-muted rounded-lg w-full" />
              <div className="h-4 bg-muted rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded-md w-12" />
                <div className="h-5 bg-muted rounded-md w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        showUploadButton={!!currentUserId}
      />
    )
  }

  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
      className
    )}>
      {materials.map(material => (
        <MaterialCard
          key={material.id}
          material={material}
          currentUserId={currentUserId}
          onDelete={onDelete}
          showStatus={showStatus}
        />
      ))}
    </div>
  )
}
