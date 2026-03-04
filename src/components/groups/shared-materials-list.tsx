'use client'
// src/components/groups/shared-materials-list.tsx
import { useState } from 'react'
import Image from 'next/image'
import { Download, Trash2, FileText, Image as ImageIcon, Video, Music, File, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { getInitials } from '@/lib/utils'

interface SharedMaterial {
  id: string; sharedAt: string
  sharedBy: string
  sharer: { id: string; name: string; avatar?: string }
  material: { id: string; title: string; description?: string; type: string; fileUrl: string; fileSize: number; subject?: string; tags: string[] }
}

const FileIcon = ({ type }: { type: string }) => {
  if (type.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-400" />
  if (type.includes('video')) return <Video className="h-5 w-5 text-purple-400" />
  if (type.includes('audio')) return <Music className="h-5 w-5 text-pink-400" />
  if (type === 'PDF') return <FileText className="h-5 w-5 text-red-400" />
  return <File className="h-5 w-5 text-muted-foreground" />
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface SharedMaterialsListProps {
  materials: SharedMaterial[]
  currentUserId: string
  canManage?: boolean
  groupId: string
  onRefresh?: () => void
}

export function SharedMaterialsList({ materials, currentUserId, canManage, groupId, onRefresh }: SharedMaterialsListProps) {
  const [removing, setRemoving] = useState<string | null>(null)

  const handleUnshare = async (materialId: string) => {
    setRemoving(materialId)
    try {
      await fetch(`/api/groups/${groupId}/materials/${materialId}`, { method: 'DELETE' })
      onRefresh?.()
    } finally {
      setRemoving(null)
    }
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📚</div>
        <p className="text-sm text-muted-foreground">No materials shared yet. Be the first to share!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {materials.map(gm => (
        <div key={gm.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <FileIcon type={gm.material.type} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{gm.material.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatSize(gm.material.fileSize)}</span>
              {gm.material.subject && <span>• {gm.material.subject}</span>}
              <span>• shared by {gm.sharer.name}</span>
              <span>• {format(new Date(gm.sharedAt), 'MMM d')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={gm.material.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </a>
            {(canManage || gm.sharer.id === currentUserId) && (
              <button
                onClick={() => handleUnshare(gm.material.id)}
                disabled={removing === gm.material.id}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
              >
                {removing === gm.material.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
