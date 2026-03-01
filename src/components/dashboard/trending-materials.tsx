'use client'
// src/components/dashboard/trending-materials.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Eye, Download, BookOpen, ArrowRight } from 'lucide-react'
import { TypeBadge } from '@/components/materials/type-badge'
import { cn } from '@/lib/utils'

interface TrendingMaterial {
  id: string
  title: string
  subject: string | null
  type: string
  viewCount: number
  downloadCount: number
}

export function TrendingMaterials() {
  const [materials, setMaterials] = useState<TrendingMaterial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/materials?limit=5&sortBy=views&sortOrder=desc&isPublic=true')
      .then(r => r.json())
      .then(d => {
        if (d.success) setMaterials(d.data.materials)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  if (materials.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-lg font-semibold">Trending</h2>
        </div>
        <Link href="/materials/public" className="text-sm text-primary hover:underline flex items-center gap-1">
          Browse all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {materials.map((material, index) => (
          <Link
            key={material.id}
            href={`/materials/${material.id}`}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-xl border border-border bg-card',
              'hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all'
            )}
          >
            {/* Rank */}
            <span className={cn(
              'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0',
              index === 0 ? 'bg-orange-500/20 text-orange-500' :
              index === 1 ? 'bg-slate-400/20 text-slate-500' :
              index === 2 ? 'bg-amber-600/20 text-amber-700' :
              'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {material.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {material.subject || material.type}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" /> {material.viewCount}
              </span>
              <span className="flex items-center gap-0.5">
                <Download className="w-3 h-3" /> {material.downloadCount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
