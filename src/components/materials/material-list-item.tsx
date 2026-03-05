'use client'
// src/components/materials/material-list-item.tsx
import Link from 'next/link'
import { Material, User } from '@prisma/client'
import { Eye, Download, Calendar, Edit, Trash2, MoreVertical, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TypeBadge } from './type-badge'
import { StatusBadge } from './status-badge'
import { formatFileSize, timeAgo } from '@/lib/materials/material-utils'

type MaterialWithUser = Material & { 
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'image'>,
  slug?: string | null
}

interface MaterialListItemProps {
  material: MaterialWithUser
  currentUserId?: string
  onDelete?: (id: string) => void
  showStatus?: boolean
}

export function MaterialListItem({ material, currentUserId, onDelete, showStatus }: MaterialListItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = currentUserId === material.userId

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all group">
      {/* Type Badge */}
      <TypeBadge type={material.type} size="md" className="hidden sm:flex" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/materials/${material.slug || material.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary">{material.title}</h3>
        </Link>
        {material.subject && (
          <p className="text-xs text-muted-foreground truncate">{material.subject}</p>
        )}
        {material.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {material.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-muted-foreground/60">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {material.viewCount}</span>
        <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {material.downloadCount}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {timeAgo(material.createdAt)}</span>
        <span className="text-muted-foreground/50">{formatFileSize(material.fileSize)}</span>
      </div>

      {/* Status */}
      {showStatus && <StatusBadge status={material.status} className="hidden sm:flex" />}

      {/* Actions */}
      {isOwner && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 w-36 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
              <Link
                href={`/materials/${material.slug || material.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLink className="w-3.5 h-3.5" /> View
              </Link>
              <Link
                href={`/materials/${material.slug || material.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
              <button
                onClick={() => { setMenuOpen(false); onDelete?.(material.id) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
