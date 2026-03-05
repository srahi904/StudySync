'use client'
// src/components/materials/edit-material-form.tsx
// Reusable standalone edit form (used by both inline edits and the edit page)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Material } from '@/lib/materials/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PREDEFINED_SUBJECTS } from '@/lib/materials/material-utils'
import { Tag, X, Globe, Lock, Save, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditMaterialFormProps {
  material: Pick<Material, 'id' | 'title' | 'description' | 'subject' | 'tags' | 'isPublic'>
  onSuccess?: (updated: Partial<Material>) => void
  onCancel?: () => void
  redirectAfterSave?: string
  compact?: boolean
}

const MAX_TAGS = 10

export function EditMaterialForm({ material, onSuccess, onCancel, redirectAfterSave, compact = false }: EditMaterialFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState(material.title)
  const [description, setDescription] = useState(material.description || '')
  const [subject, setSubject] = useState(material.subject || '')
  const [tags, setTags] = useState<string[]>(material.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(material.isPublic)
  const [saving, setSaving] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (clean && !tags.includes(clean) && tags.length < MAX_TAGS) {
      setTags(prev => [...prev, clean])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const isDirty =
    title !== material.title ||
    description !== (material.description || '') ||
    subject !== (material.subject || '') ||
    JSON.stringify(tags) !== JSON.stringify(material.tags || []) ||
    isPublic !== material.isPublic

  const isValid = title.trim().length >= 3

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
        body: JSON.stringify({ title, subject, existingDescription: description }),
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !isDirty || saving) return
    setSaving(true)

    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || undefined,
          tags,
          isPublic,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()

      toast({ title: '✓ Saved', description: 'Changes applied successfully.' })
      onSuccess?.(data.data)

      if (redirectAfterSave) {
        router.push(redirectAfterSave)
      }
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' as any })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-title" className="font-semibold text-sm">Title *</Label>
          <span className="text-xs text-muted-foreground">{title.length}/200</span>
        </div>
        <Input
          id="edit-title"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 200))}
          placeholder="Material title"
          required
          disabled={saving}
        />
      </div>

      {/* Description (hidden in compact mode) */}
      {!compact && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="edit-description" className="text-sm">Description</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={saving || generatingAi || !title.trim()}
                className="h-7 text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-0"
              >
                {generatingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Generate with AI
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{description.length}/1000</span>
          </div>
          <textarea
            id="edit-description"
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Brief description..."
            rows={3}
            disabled={saving}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-subject" className="font-semibold text-sm">Subject</Label>
        <select
          id="edit-subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={saving}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          <option value="">Select subject...</option>
          {PREDEFINED_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Tags</Label>
          <span className="text-xs text-muted-foreground">{tags.length}/{MAX_TAGS}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-background min-h-[44px] focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-lg">
              <Tag className="w-2.5 h-2.5" />
              {tag}
              <button type="button" onClick={() => removeTag(tag)} disabled={saving} className="hover:text-red-500 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {tags.length < MAX_TAGS && (
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags(t => t.slice(0, -1))
              }}
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
              disabled={saving}
              className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          )}
        </div>
      </div>

      {/* Visibility */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: false, icon: Lock, label: 'Private' },
          { value: true, icon: Globe, label: 'Public' },
        ].map(opt => {
          const Icon = opt.icon
          return (
            <label key={String(opt.value)} className={cn(
              'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm',
              isPublic === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
            )}>
              <input type="radio" name="edit-visibility" value={String(opt.value)} checked={isPublic === opt.value} onChange={() => setIsPublic(opt.value)} className="sr-only" />
              <Icon className={cn('w-4 h-4', isPublic === opt.value ? 'text-primary' : 'text-muted-foreground')} />
              <span className="font-medium">{opt.label}</span>
            </label>
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">Cancel</Button>
        )}
        <Button type="submit" disabled={!isDirty || !isValid || saving} className="flex-1 gap-2">
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </Button>
      </div>
    </form>
  )
}
