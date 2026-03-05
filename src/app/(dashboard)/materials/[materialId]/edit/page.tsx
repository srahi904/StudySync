'use client'
// src/app/(dashboard)/materials/[materialId]/edit/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PREDEFINED_SUBJECTS } from '@/lib/materials/material-utils'
import { ArrowLeft, Tag, X, Globe, Lock, Save } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function EditMaterialPage() {
  const { materialId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    const fetchMaterial = async () => {
      const res = await fetch(`/api/materials/${materialId}`)
      if (!res.ok) { router.push('/materials'); return }
      const data = await res.json()
      const m = data.data
      // Ownership check
      if (m.userId !== session?.user?.id) { router.push(`/materials/${materialId}`); return }
      setMaterial(m)
      setTitle(m.title)
      setDescription(m.description || '')
      setSubject(m.subject || '')
      setTags(m.tags || [])
      setIsPublic(m.isPublic)
      setLoading(false)
    }
    if (materialId && session) fetchMaterial()
  }, [materialId, session])

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (clean && !tags.includes(clean) && tags.length < 10) {
      setTags([...tags, clean])
    }
    setTagInput('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, subject, tags, isPublic }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: '✓ Changes saved', description: 'Your material has been updated.' })
      router.push(`/materials/${materialId}`)
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' as any })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-1/2" />
      <div className="h-96 bg-muted rounded-2xl" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/materials/${materialId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Material
        </Link>
        <h1 className="text-2xl font-display font-extrabold">Edit Material</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update information for: <strong>{material?.title}</strong></p>
      </div>

      <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="title" className="font-semibold">Title *</Label>
            <span className="text-xs text-muted-foreground">{title.length}/200</span>
          </div>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value.slice(0, 200))} required />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="desc">Description</Label>
            <span className="text-xs text-muted-foreground">{description.length}/1000</span>
          </div>
          <textarea
            id="desc"
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 1000))}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="font-semibold">Subject *</Label>
          <select
            id="subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:bg-card dark:[color-scheme:dark]"
          >
            <option value="">Select a subject...</option>
            {PREDEFINED_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags <span className="text-xs text-muted-foreground">({tags.length}/10)</span></Label>
          <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">
                <Tag className="w-2.5 h-2.5" />
                {tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {tags.length < 10 && (
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                  if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(tags.slice(0, -1))
                }}
                placeholder="Add tags..."
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            )}
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-3">
          <Label className="font-semibold">Visibility</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, icon: Lock, label: 'Private', desc: 'Only you can see' },
              { value: true, icon: Globe, label: 'Public', desc: 'Everyone can view' },
            ].map(opt => {
              const Icon = opt.icon
              return (
                <label key={String(opt.value)} className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                  isPublic === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                )}>
                  <input type="radio" name="visibility" checked={isPublic === opt.value} onChange={() => setIsPublic(opt.value)} className="sr-only" />
                  <Icon className={cn('w-5 h-5', isPublic === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-1 gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
