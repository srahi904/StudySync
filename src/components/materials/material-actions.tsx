'use client'
// src/components/materials/material-actions.tsx
// Standalone action buttons bar for material detail page
import { Download, Edit2, Trash2, Share2, Eye, Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface MaterialActionsProps {
  materialId: string
  fileUrl: string
  isOwner: boolean
  isPublic: boolean
  onDelete?: () => void
  onToggleVisibility?: (newValue: boolean) => Promise<void>
  className?: string
}

export function MaterialActions({
  materialId, fileUrl, isOwner, isPublic, onDelete, onToggleVisibility, className
}: MaterialActionsProps) {
  const { toast } = useToast()
  const [toggling, setToggling] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({ title: '🔗 Link copied!', description: 'Share this link with friends.' })
    })
  }

  const handleDownload = async () => {
    // Track download
    await fetch(`/api/materials/analytics/${materialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    }).catch(() => {})
    window.open(fileUrl, '_blank')
  }

  const handleToggle = async () => {
    if (!onToggleVisibility || toggling) return
    setToggling(true)
    try {
      await onToggleVisibility(!isPublic)
      toast({ title: isPublic ? '🔒 Made private' : '🌐 Made public' })
    } catch {
      toast({ title: 'Failed to update visibility', variant: 'destructive' as any })
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Download */}
      <Button size="sm" onClick={handleDownload} className="gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Download
      </Button>

      {/* Share */}
      <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </Button>

      {/* Full-screen view */}
      <Button size="sm" variant="outline" asChild className="gap-1.5">
        <Link href={`/materials/${materialId}/view`}>
          <Eye className="w-3.5 h-3.5" />
          Full View
        </Link>
      </Button>

      {/* Owner-only actions */}
      {isOwner && (
        <>
          {/* Toggle visibility */}
          {onToggleVisibility && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggle}
              disabled={toggling}
              className="gap-1.5"
            >
              {toggling ? (
                <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : isPublic ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              {isPublic ? 'Make Private' : 'Make Public'}
            </Button>
          )}

          {/* Edit */}
          <Button size="sm" variant="outline" asChild className="gap-1.5">
            <Link href={`/materials/${materialId}/edit`}>
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </>
      )}
    </div>
  )
}
