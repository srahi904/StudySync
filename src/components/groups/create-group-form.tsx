'use client'
// src/components/groups/create-group-form.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateGroupSchema, CreateGroupInput } from '@/lib/validations'
import { Loader2, X, Plus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const SUBJECTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Engineering', 'Medicine', 'Law', 'Business', 'Economics', 'Literature',
  'History', 'Psychology', 'Philosophy', 'Art & Design', 'Music', 'Other'
]

export function CreateGroupForm() {
  const router = useRouter()
  const [tagInput, setTagInput] = useState('')
  const [creating, setCreating] = useState(false)

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: { name: '', description: '', subject: '', tags: [], privacy: 'PUBLIC', maxMembers: 50 },
  })

  const tags = form.watch('tags') || []

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      form.setValue('tags', [...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    form.setValue('tags', tags.filter(t => t !== tag))
  }

  const onSubmit = async (data: CreateGroupInput) => {
    setCreating(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Group created!' })
        router.push(`/groups/${result.data.id}`)
      } else {
        toast({ title: result.message || 'Failed to create group', variant: "destructive" })
      }
    } finally { setCreating(false) }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Group Name *</label>
        <input
          {...form.register('name')}
          placeholder="e.g. CS Finals Study Group"
          className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors"
        />
        {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Subject *</label>
        <select
          {...form.register('subject')}
          className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors appearance-none"
        >
          <option value="">Select a subject...</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {form.formState.errors.subject && <p className="text-xs text-destructive mt-1">{form.formState.errors.subject.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          {...form.register('description')}
          placeholder="What's this group about?"
          rows={3}
          className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Tags (up to 10)</label>
        <div className="flex gap-2 mb-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="Add a tag..."
            className="flex-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-2 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
          <button type="button" onClick={addTag} className="px-4 py-2 rounded-xl bg-muted text-sm hover:bg-muted/80 flex items-center gap-1">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Privacy + Max Members */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Privacy</label>
          <div className="space-y-2">
            {[
              { value: 'PUBLIC', label: 'Public', desc: 'Anyone can join' },
              { value: 'PRIVATE', label: 'Private', desc: 'Request to join' },
              { value: 'INVITE_ONLY', label: 'Invite Only', desc: 'Invitation required' },
            ].map(opt => (
              <label key={opt.value} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 cursor-pointer hover:border-primary/30 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input
                  type="radio"
                  {...form.register('privacy')}
                  value={opt.value}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Max Members: <span className="text-primary">{form.watch('maxMembers')}</span>
          </label>
          <input
            type="range"
            min={2}
            max={500}
            step={1}
            {...form.register('maxMembers', { valueAsNumber: true })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>2</span><span>500</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Group'}
      </button>
    </form>
  )
}
