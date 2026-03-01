'use client'
// src/components/materials/material-card.tsx
import Link from 'next/link'
import { Material, MaterialType, User } from '@prisma/client'
import { Eye, Download, Calendar, BookOpen, MoreVertical, Edit, Trash2, Share2, Sparkles, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TypeBadge } from './type-badge'
import { StatusBadge } from './status-badge'
import { formatFileSize, timeAgo, getMaterialTypeColor } from '@/lib/materials/material-utils'
import { PrivacyBadge } from './privacy-badge'

type MaterialWithUser = Material & { 
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'image'>,
  sharedWith?: any[],
  visibility?: 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY'
}

interface MaterialCardProps {
  material: MaterialWithUser
  currentUserId?: string
  onDelete?: (id: string) => void
  showStatus?: boolean
  className?: string
}

const TYPE_PREVIEW_COLORS: Record<MaterialType, string> = {
  PDF: 'from-red-500/20 via-red-400/10 to-orange-500/10',
  DOCUMENT: 'from-blue-500/20 via-blue-400/10 to-cyan-500/10',
  PRESENTATION: 'from-orange-500/20 via-orange-400/10 to-yellow-500/10',
  SPREADSHEET: 'from-emerald-500/20 via-emerald-400/10 to-green-500/10',
  IMAGE: 'from-green-500/20 via-teal-400/10 to-cyan-500/10',
  VIDEO: 'from-purple-500/20 via-purple-400/10 to-indigo-500/10',
  AUDIO: 'from-pink-500/20 via-rose-400/10 to-red-500/10',
  TEXT: 'from-slate-500/20 via-gray-400/10 to-zinc-500/10',
  OTHER: 'from-violet-500/20 via-purple-400/10 to-fuchsia-500/10',
}

export function MaterialCard({ material, currentUserId, onDelete, showStatus = false, className }: MaterialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = currentUserId === material.userId
  
  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/materials/process/${material.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.details || data.error || 'Failed to process context')
      alert('Material successfully processed for AI Assistant context!')
      window.location.reload()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsProcessing(false)
      setMenuOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={cn(
      'group bg-card border border-border rounded-2xl overflow-hidden',
      'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer',
      className
    )}>
      {/* Preview Area */}
      <Link href={`/materials/${material.id}`}>
        <div className={cn(
          'h-44 bg-gradient-to-br flex items-center justify-center relative',
          TYPE_PREVIEW_COLORS[material.type]
        )}>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-foreground/60" />
          </div>
          {/* Views overlay */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-foreground/50">
            <Eye className="w-3.5 h-3.5" />
            <span>{material.viewCount}</span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type badge + menu */}
        <div className="flex items-start justify-between gap-2">
          <TypeBadge type={material.type} />
          {material.visibility && (
            <PrivacyBadge 
              visibility={material.visibility as 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY'} 
              sharedCount={material.sharedWith?.length || 0} 
            />
          )}

          {/* Context menu for owner */}
          {isOwner && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-40 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                  <Link
                    href={`/materials/${material.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <Link
                    href={`/materials/${material.id}/view`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  {/* AI Processing button */}
                  {!material.isProcessed && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleProcess()
                      }}
                      disabled={isProcessing}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isProcessing ? 'Processing...' : 'Add to AI Context'}
                    </button>
                  )}
                  {material.isProcessed && (
                    <div className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 bg-green-500/5 transition-colors cursor-default">
                      <Sparkles className="w-3.5 h-3.5" /> Processed for AI
                    </div>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onDelete?.(material.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/materials/${material.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {material.title}
          </h3>
        </Link>

        {/* Description */}
        {material.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {material.description}
          </p>
        )}

        {/* Subject */}
        {material.subject && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            <span className="truncate">{material.subject}</span>
          </div>
        )}

        {/* Tags */}
        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                #{tag}
              </span>
            ))}
            {material.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-muted-foreground text-xs">
                +{material.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/50">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {material.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {material.downloadCount}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />
            {timeAgo(material.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
