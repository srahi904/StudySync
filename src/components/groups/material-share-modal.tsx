'use client'
// src/components/groups/material-share-modal.tsx
import { useState, useEffect } from 'react'
import { X, Search, Loader2, BookOpen } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Material { id: string; title: string; type: string; subject?: string }

interface MaterialShareModalProps {
  groupId: string
  onClose: () => void
  onShared?: () => void
}

export function MaterialShareModal({ groupId, onClose, onShared }: MaterialShareModalProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/materials?limit=50').then(r => r.json()).then(d => {
      if (d.data?.materials) setMaterials(d.data.materials)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const handleShare = async (materialId: string) => {
    setSharing(materialId)
    try {
      const res = await fetch(`/api/groups/${groupId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      })
      const data = await res.json()
      if (data.success) { toast({ title: 'Material shared!' }); onShared?.(); onClose() }
      else toast({ title: data.message || 'Failed to share', variant: "destructive" })
    } finally {
      setSharing(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border/50 bg-card shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-lg font-semibold">Share Material with Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your materials..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No materials found</div>
          ) : (
            filtered.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  {m.subject && <p className="text-xs text-muted-foreground">{m.subject}</p>}
                </div>
                <button
                  onClick={() => handleShare(m.id)}
                  disabled={sharing === m.id}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {sharing === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Share'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
