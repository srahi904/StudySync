'use client'
// src/components/materials/material-header.tsx
// Header block for material detail page: title, badges, author, stats
import { Material, MaterialUser } from '@/lib/materials/types'
import { TypeBadge } from './type-badge'
import { StatusBadge } from './status-badge'
import { MaterialActions } from './material-actions'
import { MaterialStats } from './material-stats'
import { Globe, Lock, User as UserIcon, BookOpen, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type MaterialWithUser = Material & { user?: MaterialUser }

const TYPE_BG: Record<string, string> = {
  PDF: 'from-red-500/20 to-orange-500/10',
  DOCUMENT: 'from-blue-500/20 to-cyan-500/10',
  PRESENTATION: 'from-orange-500/20 to-yellow-500/10',
  SPREADSHEET: 'from-emerald-500/20 to-green-500/10',
  IMAGE: 'from-teal-500/20 to-cyan-500/10',
  VIDEO: 'from-purple-500/20 to-indigo-500/10',
  AUDIO: 'from-pink-500/20 to-rose-500/10',
  TEXT: 'from-slate-500/20 to-gray-500/10',
  OTHER: 'from-violet-500/20 to-fuchsia-500/10',
}

interface MaterialHeaderProps {
  material: MaterialWithUser
  isOwner: boolean
  onDelete?: () => void
  onToggleVisibility?: (newValue: boolean) => Promise<void>
  className?: string
}

export function MaterialHeader({ material, isOwner, onDelete, onToggleVisibility, className }: MaterialHeaderProps) {
  const bgGrad = TYPE_BG[material.type] || TYPE_BG.OTHER

  return (
    <div className={cn('bg-card border border-border rounded-2xl overflow-hidden', className)}>
      {/* Gradient banner */}
      <div className={cn('h-28 bg-gradient-to-br flex items-center justify-center', bgGrad)}>
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <FileText className="w-8 h-8 text-foreground/70" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={material.type} />
          <StatusBadge status={material.status} />
          {material.isPublic ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="w-3 h-3 text-blue-400" /> Public
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl md:text-2xl font-display font-extrabold leading-snug">
            {material.title}
          </h1>
          {material.description && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {material.description}
            </p>
          )}
        </div>

        {/* Author + Subject */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {material.user && (
            <span className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              {material.user.name}
            </span>
          )}
          {material.subject && (
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {material.subject}
            </span>
          )}
        </div>

        {/* Stats */}
        <MaterialStats
          viewCount={material.viewCount}
          downloadCount={material.downloadCount}
          createdAt={material.createdAt}
        />

        {/* Actions */}
        <div className="pt-1 border-t border-border/50">
          <MaterialActions
            materialId={material.id}
            fileUrl={material.fileUrl}
            isOwner={isOwner}
            isPublic={material.isPublic}
            onDelete={onDelete}
            onToggleVisibility={onToggleVisibility}
          />
        </div>
      </div>
    </div>
  )
}
