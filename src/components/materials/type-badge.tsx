'use client'
// src/components/materials/type-badge.tsx
import { MaterialType } from '@prisma/client'
import { cn } from '@/lib/utils'
import { getMaterialTypeLabel, getMaterialTypeColor } from '@/lib/materials/material-utils'
import {
  FileText, File, Presentation, Table, Image, Video, Music, AlignLeft, FileQuestion
} from 'lucide-react'

const TYPE_ICONS: Record<MaterialType, React.ElementType> = {
  PDF: FileText,
  DOCUMENT: File,
  PRESENTATION: Presentation,
  SPREADSHEET: Table,
  IMAGE: Image,
  VIDEO: Video,
  AUDIO: Music,
  TEXT: AlignLeft,
  OTHER: FileQuestion,
}

interface TypeBadgeProps {
  type: MaterialType
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, className, showIcon = true, size = 'sm' }: TypeBadgeProps) {
  const Icon = TYPE_ICONS[type] ?? FileQuestion
  const colorClass = getMaterialTypeColor(type)
  const label = getMaterialTypeLabel(type)

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      colorClass,
      className
    )}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {label}
    </span>
  )
}
