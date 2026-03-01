'use client'
// src/app/(dashboard)/materials/[materialId]/page.tsx - Material Detail Page
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Download, Edit2, Trash2, Eye, Share2, BookOpen,
  Calendar, User, Globe, Lock, Tag, ExternalLink, FileText
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TypeBadge } from '@/components/materials/type-badge'
import { StatusBadge } from '@/components/materials/status-badge'
import { DeleteModal } from '@/components/materials/delete-modal'
import { useToast } from '@/components/ui/use-toast'
import { formatFileSize, timeAgo } from '@/lib/materials/material-utils'
import { PrivacyBadge } from '@/components/materials/privacy-badge'
import { ShareModal } from '@/components/materials/share-modal'
import { cn } from '@/lib/utils'

type Tab = 'preview' | 'details' | 'activity'

export default function MaterialDetailPage() {
  const { materialId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('preview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/materials/${materialId}`)
        if (res.ok) {
          const data = await res.json()
          setMaterial(data.data)
        } else if (res.status === 404) {
          router.push('/materials')
        }
      } finally {
        setLoading(false)
      }
    }
    if (materialId) fetchMaterial()
  }, [materialId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-1/3" />
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (!material) return null

  const isOwner = session?.user?.id === material.userId

  const handleDelete = async () => {
    const res = await fetch(`/api/materials/${materialId}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Material deleted' })
      router.push('/materials')
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' as any })
    }
  }

  const handleDownload = async () => {
    // Track download analytics
    await fetch(`/api/materials/analytics/${materialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    }).catch(() => {})

    // Open file 
    window.open(material.fileUrl, '_blank')
  }

  const handleShare = () => {
    if (isOwner && material.visibility === 'PRIVATE') {
      setShowShareModal(true)
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Link copied!', description: 'Share this link with anyone.' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/materials"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Materials
      </Link>

      {/* Header Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Type icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <TypeBadge type={material.type} />
              <StatusBadge status={material.status} />
              {material.visibility && (
                <PrivacyBadge 
                  visibility={material.visibility} 
                  sharedCount={material.sharedWith?.length || 0} 
                />
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold leading-tight">
              {material.title}
            </h1>
            {material.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {material.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/materials/${materialId}/edit`}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border/50">
          {material.user && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              By {material.user.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {timeAgo(material.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {material.viewCount} views
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            {material.downloadCount} downloads
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Tab Nav */}
        <div className="flex border-b border-border">
          {(['preview', 'details', 'activity'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 px-4 py-3.5 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tab === 'preview' && (
            <div className="space-y-4">
              {material.type === 'PDF' || material.type === 'IMAGE' ? (
                <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
                  {material.type === 'IMAGE' ? (
                    <img
                      src={material.fileUrl}
                      alt={material.title}
                      className="max-w-full h-auto rounded-xl"
                    />
                  ) : (
                    <iframe
                      src={material.fileUrl}
                      className="w-full h-[600px] rounded-xl"
                      title={material.title}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Preview not available</p>
                    <p className="text-sm text-muted-foreground">Download the file to view its contents</p>
                  </div>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" /> Download to View
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Subject', value: material.subject || '—', icon: BookOpen },
                { label: 'File Type', value: material.type, icon: FileText },
                { label: 'File Size', value: formatFileSize(material.fileSize), icon: FileText },
                { label: 'File Name', value: material.fileName, icon: FileText },
                { label: 'Status', value: material.status, icon: Eye },
                { label: 'Views', value: material.viewCount.toString(), icon: Eye },
                { label: 'Downloads', value: material.downloadCount.toString(), icon: Download },
                { label: 'Uploaded', value: new Date(material.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20">
                  <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium truncate">{value}</p>
                  </div>
                </div>
              ))}
              {material.tags.length > 0 && (
                <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-muted/20">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {material.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Activity tracking will be available in Week 10 (Analytics).</p>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        materialTitle={material.title}
      />
      
      {materialId && typeof materialId === 'string' && (
        <ShareModal
          materialId={materialId}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
