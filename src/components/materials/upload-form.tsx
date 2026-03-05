'use client'
// src/components/materials/upload-form.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUploader } from './file-uploader'
import { UploadProgress } from './upload-progress'
import { cn } from '@/lib/utils'
import { getMaterialTypeFromMime, PREDEFINED_SUBJECTS } from '@/lib/materials/material-utils'
import { Globe, Lock, Tag, X, Plus, BookOpen, FileText, Users, Sparkles, Loader2 } from 'lucide-react'

const MAX_TAGS = 10
const MAX_TITLE = 200
const MAX_DESC = 1000

interface UploadFormProps {
  onSuccess?: (materialId: string) => void
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY'>('PRIVATE')

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)

  // Auto-fill title from filename
  useEffect(() => {
    if (file && !title) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(name.charAt(0).toUpperCase() + name.slice(1))
    }
  }, [file])

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (clean && !tags.includes(clean) && tags.length < MAX_TAGS) {
      setTags([...tags, clean])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const finalSubject = subject === 'Other' ? customSubject : subject

  const isValid = file && title.trim().length >= 3 && finalSubject.trim()

  const handleGenerateDescription = async () => {
    if (!title || title.trim().length < 3) {
      toast({ title: 'Please enter a valid title first', variant: 'destructive' })
      return
    }

    setGeneratingAi(true)
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject: finalSubject, existingDescription: description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')
      
      setDescription(data.description)
      toast({ title: '✨ Description generated!' })
    } catch (err: any) {
      toast({ title: 'AI Generation Failed', description: err.message, variant: 'destructive' })
    } finally {
      setGeneratingAi(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)

    try {
      // Step 1: Upload file
      setUploadStatus('uploading')
      setUploadProgress(10)
      
      const formData = new FormData()
      formData.append('file', file!)

      // Simulate XHR for progress tracking
      const uploadRes = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 80) + 10)
          }
        })
        xhr.addEventListener('load', () => resolve(new Response(xhr.responseText, { status: xhr.status })))
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('POST', '/api/materials/upload')
        xhr.send(formData)
      })

      setUploadProgress(90)

      if (!uploadRes.ok) throw new Error('File upload failed')
      const uploadData = await uploadRes.json()

      // Step 2: Save metadata
      const createRes = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          subject: finalSubject.trim(),
          tags,
          visibility,
          fileUrl: uploadData.data.fileUrl,
          fileName: uploadData.data.fileName,
          fileSize: uploadData.data.fileSize,
          mimeType: uploadData.data.mimeType,
        }),
      })

      setUploadProgress(100)

      if (!createRes.ok) throw new Error('Failed to save material')
      const created = await createRes.json()

      setUploadStatus('success')
      toast({ title: '🎉 Material uploaded!', description: 'Your study material has been uploaded successfully.' })

      // Auto-trigger background AI processing
      fetch(`/api/materials/process/${created.data.id}`, { method: 'POST' }).catch(console.error)

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(created.data.id)
        } else {
          router.push(`/materials/${created.data.slug || created.data.id}`)
        }
      }, 1200)

    } catch (err) {
      setUploadStatus('error')
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Upload */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Study Material File *</Label>
        {uploadStatus === 'idle' || uploadStatus === 'error' ? (
          <FileUploader
            onFileSelect={setFile}
            onClear={() => { setFile(null); setTitle('') }}
            selectedFile={file}
            disabled={submitting}
          />
        ) : (
          <UploadProgress
            progress={uploadProgress}
            status={uploadStatus as any}
            fileName={file?.name}
            errorMessage={uploadError}
          />
        )}
      </div>

      {/* Details */}
      {file && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="font-semibold">Title *</Label>
              <span className="text-xs text-muted-foreground">{title.length}/{MAX_TITLE}</span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="e.g., Operating Systems Notes Chapter 1-3"
              required
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={submitting || generatingAi || !title.trim()}
                  className="h-7 text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                >
                  {generatingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate AI Description
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">{description.length}/{MAX_DESC}</span>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Describe what this material covers..."
              rows={3}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="font-semibold">Subject *</Label>
            <select
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              <option value="">Select a subject...</option>
              {PREDEFINED_SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {subject === 'Other' && (
              <Input
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject name..."
                className="mt-2"
                disabled={submitting}
              />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <span className="text-xs text-muted-foreground">{tags.length}/{MAX_TAGS}</span>
            </div>
            <div className={cn(
              'flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background min-h-[48px]',
              'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all'
            )}>
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} disabled={submitting} className="hover:text-red-500">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {tags.length < MAX_TAGS && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)...' : ''}
                  disabled={submitting}
                  className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag. Max {MAX_TAGS} tags.</p>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label className="font-semibold">Visibility</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                visibility === 'PRIVATE' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
              )}>
                <input type="radio" name="visibility" checked={visibility === 'PRIVATE'} onChange={() => setVisibility('PRIVATE')} className="sr-only" />
                <Lock className={cn('w-5 h-5', visibility === 'PRIVATE' ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium">Private</p>
                  <p className="text-xs text-muted-foreground">Only you can see</p>
                </div>
              </label>
              <label className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                visibility === 'PUBLIC' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
              )}>
                <input type="radio" name="visibility" checked={visibility === 'PUBLIC'} onChange={() => setVisibility('PUBLIC')} className="sr-only" />
                <Globe className={cn('w-5 h-5', visibility === 'PUBLIC' ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium">Public</p>
                  <p className="text-xs text-muted-foreground">Everyone can view</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="flex-1"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : 'Upload Material'}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
