'use client'
// src/app/(dashboard)/materials/[materialId]/view/page.tsx - Full-screen Material Viewer
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/materials/type-badge'
import { useToast } from '@/components/ui/use-toast'

export default function MaterialViewerPage() {
  const { materialId } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/materials/${materialId}`)
        if (!res.ok) { router.push('/materials'); return }
        const data = await res.json()
        setMaterial(data.data)
        // Track view
        fetch(`/api/materials/analytics/${materialId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view' }),
        }).catch(() => {})
      } finally {
        setLoading(false)
      }
    }
    if (materialId) fetchMaterial()
  }, [materialId])

  const handleDownload = async () => {
    await fetch(`/api/materials/analytics/${materialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    }).catch(() => {})
    window.open(material?.fileUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!material) return null

  return (
    <div className="space-y-4">
      {/* Viewer Toolbar */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
        <Link href={`/materials/${materialId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{material.title}</p>
        </div>
        <TypeBadge type={material.type} showIcon={false} />

        {/* Zoom controls (for PDF/Image) */}
        {(material.type === 'PDF' || material.type === 'IMAGE') && (
          <>
            <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ZoomIn className="w-4 h-4" />
            </button>
          </>
        )}

        <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </div>

      {/* Viewer Content */}
      <div className="bg-muted/20 border border-border rounded-xl overflow-hidden" style={{ minHeight: '70vh' }}>
        {material.type === 'PDF' && (
          <iframe
            src={`${material.fileUrl}#zoom=${zoom}`}
            className="w-full"
            style={{ height: '75vh' }}
            title={material.title}
          />
        )}
        {material.type === 'IMAGE' && (
          <div className="flex items-center justify-center p-8 min-h-96">
            <img
              src={material.fileUrl}
              alt={material.title}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.2s', maxWidth: '100%' }}
            />
          </div>
        )}
        {material.type === 'VIDEO' && (
          <div className="flex items-center justify-center p-4">
            <video
              src={material.fileUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg"
            />
          </div>
        )}
        {material.type === 'AUDIO' && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto">
                <span className="text-4xl">🎧</span>
              </div>
              <p className="font-medium">{material.fileName}</p>
              <audio src={material.fileUrl} controls className="w-80" />
            </div>
          </div>
        )}
        {!['PDF', 'IMAGE', 'VIDEO', 'AUDIO'].includes(material.type) && (
          <div className="flex items-center justify-center flex-col gap-4 py-20">
            <p className="text-muted-foreground">Preview not available for this file type</p>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download to View
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
