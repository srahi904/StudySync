'use client'
// src/components/materials/material-viewer.tsx
// Embedded viewer for PDF, image, video, audio content
import { useState } from 'react'
import { Download, ZoomIn, ZoomOut, RotateCcw, FileText, Music, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaterialType } from '@/lib/materials/types'
import { cn } from '@/lib/utils'

interface MaterialViewerProps {
  fileUrl: string
  type: MaterialType
  title: string
  materialId: string
  className?: string
}

function ViewerToolbar({ zoom, onZoomIn, onZoomOut, onReset, onDownload, type }: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onDownload: () => void
  type: MaterialType
}) {
  const canZoom = type === 'PDF' || type === 'IMAGE'
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 border-b border-border rounded-t-xl">
      {canZoom && (
        <>
          <button onClick={onZoomOut} disabled={zoom <= 50} className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{zoom}%</span>
          <button onClick={onZoomIn} disabled={zoom >= 200} className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={onReset} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Reset zoom">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}
      <Button size="sm" variant="outline" onClick={onDownload} className="gap-1.5 ml-auto">
        <Download className="w-3.5 h-3.5" /> Download
      </Button>
    </div>
  )
}

export function MaterialViewer({ fileUrl, type, title, materialId, className }: MaterialViewerProps) {
  const [zoom, setZoom] = useState(100)

  const trackDownload = async () => {
    await fetch(`/api/materials/analytics/${materialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    }).catch(() => {})
    window.open(fileUrl, '_blank')
  }

  const handleZoomIn = () => setZoom(z => Math.min(200, z + 25))
  const handleZoomOut = () => setZoom(z => Math.max(50, z - 25))
  const handleReset = () => setZoom(100)

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onDownload={trackDownload}
        type={type}
      />

      <div className="bg-muted/10">
        {/* PDF Viewer */}
        {type === 'PDF' && (
          <iframe
            src={fileUrl}
            title={title}
            className="w-full border-0"
            style={{ height: '65vh' }}
          />
        )}

        {/* Image Viewer */}
        {type === 'IMAGE' && (
          <div className="flex items-center justify-center p-8 min-h-64 overflow-auto">
            <img
              src={fileUrl}
              alt={title}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease',
                maxWidth: '100%',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Video Player */}
        {type === 'VIDEO' && (
          <div className="flex items-center justify-center bg-black p-4">
            <video
              src={fileUrl}
              controls
              className="max-h-[65vh] rounded-lg max-w-full"
              style={{ maxHeight: '65vh' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Audio Player */}
        {type === 'AUDIO' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Music className="w-12 h-12 text-primary/60" />
            </div>
            <div className="text-center">
              <p className="font-semibold mb-1">{title}</p>
              <p className="text-sm text-muted-foreground mb-4">Audio file</p>
            </div>
            <audio src={fileUrl} controls className="w-full max-w-sm" />
          </div>
        )}

        {/* Text / Markdown */}
        {type === 'TEXT' && (
          <div className="p-6">
            <iframe
              src={fileUrl}
              title={title}
              className="w-full border-0 font-mono text-sm bg-transparent"
              style={{ height: '55vh' }}
            />
          </div>
        )}

        {/* Unsupported types */}
        {!['PDF', 'IMAGE', 'VIDEO', 'AUDIO', 'TEXT'].includes(type) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold mb-1">Preview not available</p>
              <p className="text-sm text-muted-foreground">
                {type === 'PRESENTATION' ? 'Presentations' : type === 'SPREADSHEET' ? 'Spreadsheets' : type === 'DOCUMENT' ? 'Documents' : 'This file type'}
                {' '}cannot be previewed in the browser.
              </p>
            </div>
            <Button onClick={trackDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download to View
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
