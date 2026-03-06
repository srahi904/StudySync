'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Download, Edit2, Trash2, Share2, FileText, DownloadCloud,
  ThumbsUp, MessageSquare, MoreHorizontal, Send, Image as ImageIcon,
  Paperclip, Smile
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DeleteModal } from '@/components/materials/delete-modal'
import { useToast } from '@/components/ui/use-toast'
import { timeAgo } from '@/lib/materials/material-utils'
import { ShareModal } from '@/components/materials/share-modal'
import { usePusherMulti } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

export default function MaterialDetailPage() {
  const { materialId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Social states
  const [likesCount, setLikesCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true)
      try {
        const [matRes, commentsRes] = await Promise.all([
          fetch(`/api/materials/${materialId}`),
          fetch(`/api/materials/${materialId}/comments`)
        ])
        
        if (matRes.ok) {
          const data = await matRes.json()
          setMaterial(data.data)
          if (data.data.post) {
            setLikesCount(data.data.post.likesCount || 0)
            setHasLiked(data.data.post.hasLiked || false)
            setCommentCount(data.data.post.commentCount || 0)
          }
        } else if (matRes.status === 403) {
          toast({ title: 'Access Denied', description: 'This material is private.', variant: 'destructive' })
          router.push('/dashboard')
        } else if (matRes.status === 404) {
          router.push('/materials')
        }

        if (commentsRes.ok) {
          const cData = await commentsRes.json()
          setComments(cData.data || [])
        }
      } finally {
        setLoading(false)
      }
    }
    if (materialId) fetchMaterial()
  }, [materialId, router])

  // Real-time subscriptions using the resolved database ID
  usePusherMulti({
    channelName: material?.id ? CHANNELS.material(material.id) : '',
    events: {
      [EVENTS.NEW_MATERIAL_COMMENT]: (data: any) => {
        setComments(prev => {
          if (prev.find(c => c.id === data.id)) return prev
          return [...prev, data]
        })
        setCommentCount(prev => prev + 1)
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      },
      [EVENTS.MATERIAL_LIKES_UPDATED]: (data: any) => {
        if (data.materialId === material?.id) {
          setLikesCount(data.likesCount)
        }
      }
    },
    enabled: !!material?.id
  })

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse pt-4">
        <div className="h-[400px] bg-muted/30 rounded-t-xl" />
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-muted/40" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted/40 rounded w-1/4" />
              <div className="h-3 bg-muted/40 rounded w-1/3" />
            </div>
          </div>
          <div className="h-8 bg-muted/40 rounded w-2/3" />
          <div className="h-20 bg-muted/40 rounded w-full" />
        </div>
      </div>
    )
  }

  if (!material) return null

  const isOwner = session?.user?.id === material.userId
  const isFollowingOrOwner = isOwner || material.isFollowing

  const handleLike = async () => {
    // Optimistic update
    setHasLiked(!hasLiked)
    setLikesCount(prev => hasLiked ? Math.max(0, prev - 1) : prev + 1)

    try {
      const res = await fetch(`/api/materials/${material.id}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to like')
      const data = await res.json()
      setHasLiked(data.data.hasLiked)
      setLikesCount(data.data.likesCount)
    } catch {
      // Revert on failure
      setHasLiked(!hasLiked)
      setLikesCount(prev => !hasLiked ? Math.max(0, prev - 1) : prev + 1)
      toast({ title: 'Something went wrong', variant: 'destructive' })
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/materials/${material.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      setCommentInput('')
    } catch (err) {
      toast({ title: 'Failed to post comment', variant: 'destructive' })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/materials/${material.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Material deleted' })
      router.push('/materials')
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const handleDownload = async () => {
    if (!isFollowingOrOwner) return
    await fetch(`/api/materials/analytics/${material.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download' }),
    }).catch(() => {})
    window.open(material.fileUrl, '_blank')
  }

  const handleShare = () => {
    if (!isFollowingOrOwner) return
    if (isOwner && material.visibility === 'PRIVATE') {
      setShowShareModal(true)
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Link copied!', description: 'Share this link with anyone.' })
    }
  }

  // Helper to format file size cleanly
  const sizeMb = (material.fileSize / (1024 * 1024)).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto pb-12 pt-4">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Document Preview Area (Top) */}
        <div className="w-full bg-muted/10 relative border-b border-border flex items-center justify-center overflow-hidden" style={{ minHeight: '300px', maxHeight: '600px' }}>
          {material.type === 'PDF' || material.type === 'IMAGE' ? (
            material.type === 'IMAGE' ? (
              <div className="w-full h-full relative" style={{ minHeight: '300px', maxHeight: '600px' }}>
                <Image 
                  src={material.fileUrl || ''} 
                  alt={material.title} 
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <iframe
                src={`${material.fileUrl}#toolbar=0`}
                className="w-full h-full min-h-[500px]"
                title={material.title}
              />
            )
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Preview not available</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                This file type cannot be previewed in the browser. You must download it to view its contents.
              </p>
            </div>
          )}
          
          {/* Owner Controls Floating Box */}
          {isOwner && (
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur border border-border px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Link href={`/materials/${material.id}/edit`}>
                  <Edit2 className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(true)} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content Details Area */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative rounded-full border border-border overflow-hidden flex-shrink-0 bg-muted">
              {(material.user?.avatar || material.user?.image) ? (
                <Image src={(material.user.avatar || material.user.image) as string} alt={material.user?.name || 'User'} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium bg-muted">
                  {material.user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <Link href={`/profile/${material.user?.username || material.userId}`} className="font-semibold text-sm hover:underline">
                {material.user?.name || 'Unknown User'}
              </Link>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{timeAgo(material.createdAt)}</span>
                {material.type && (
                  <>
                    <span>•</span>
                    <span>{material.type}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">
            {material.title}
          </h1>

          {material.description && (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {material.description}
            </p>
          )}

          {/* Conditional Download Button for Followers/Owners */}
          {isFollowingOrOwner && (
            <div className="pt-2">
              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2 h-10 w-full sm:w-auto">
                <DownloadCloud className="w-4 h-4" />
                Download {material.type} ({sizeMb} MB)
              </Button>
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="border-y border-border px-2 py-2 flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`gap-1.5 h-9 rounded-md ${hasLiked ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10' : 'hover:text-foreground'}`}
            >
              <ThumbsUp className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-sm font-medium">Like {likesCount > 0 && `(${likesCount})`}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1.5 h-9 rounded-md hover:text-foreground" onClick={() => {
              document.getElementById('comment-input')?.focus()
            }}>
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Comment {commentCount > 0 && `(${commentCount})`}</span>
            </Button>

            {isFollowingOrOwner && (
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 h-9 rounded-md hover:text-foreground">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </Button>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-foreground rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments Section */}
        <div className="bg-card w-full p-4 md:p-6 pb-6">
          <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
            <MoreHorizontal className="w-4 h-4 opacity-50" />
            <span>Comments ({commentCount})</span>
          </div>

          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground italic">
                No comments yet. Be the first to start the discussion!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-sm group">
                  <div className="w-8 h-8 relative rounded-full bg-muted flex-shrink-0 overflow-hidden border border-border">
                    {(comment.author?.avatar || comment.author?.image) ? (
                      <Image src={(comment.author.avatar || comment.author.image) as string} alt={comment.author?.name || 'User'} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-medium opacity-50">
                        {comment.author?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 bg-muted/30 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-semibold">{comment.author?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap word-break-all leading-normal">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start relative mt-4">
            <div className="w-9 h-9 relative rounded-full bg-muted flex-shrink-0 overflow-hidden border border-border border-b-0 hidden sm:block">
              {(session?.user?.avatar || session?.user?.image) ? (
                <Image src={(session.user.avatar || session.user.image) as string} alt="You" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-medium opacity-50">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1 border border-border bg-background rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all shadow-sm">
              <textarea
                id="comment-input"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-transparent resize-none outline-none text-sm px-4 py-3 min-h-[44px] max-h-[120px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (commentInput.trim()) handleCommentSubmit(e)
                  }
                }}
              />
              <div className="flex items-center justify-between px-2 py-2 bg-muted/10 border-t border-border/50">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md transition-colors hover:text-foreground">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md transition-colors hover:text-foreground">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md transition-colors hover:text-foreground hidden sm:inline-flex">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!commentInput.trim() || isSubmittingComment}
                  size="sm"
                  variant="default"
                  className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md shrink-0"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        materialTitle={material.title}
      />
      
      <ShareModal
        materialId={material.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}
