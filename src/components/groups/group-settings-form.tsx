'use client'
// src/components/groups/group-settings-form.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateGroupSchema, UpdateGroupInput } from '@/lib/validations'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const SUBJECTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Engineering', 'Medicine', 'Law', 'Business', 'Economics', 'Literature',
  'History', 'Psychology', 'Philosophy', 'Art & Design', 'Music', 'Other'
]

interface GroupSettingsFormProps {
  group: {
    id: string; name: string; description?: string; subject: string
    privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; maxMembers: number
    settings?: { allowInvites?: boolean; allowMaterialSharing?: boolean }
  }
  isOwner: boolean
}

export function GroupSettingsForm({ group, isOwner }: GroupSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<UpdateGroupInput>({
    resolver: zodResolver(UpdateGroupSchema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
      subject: group.subject,
      privacy: group.privacy,
      maxMembers: group.maxMembers,
    },
  })

  const onSubmit = async (data: UpdateGroupInput) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) toast({ title: 'Settings saved!' })
      else toast({ title: result.message || 'Failed to save', variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!prompt('Type the group name to confirm deletion:') === null) return
    if (!confirm(`This will permanently delete "${group.name}" and all its data. Continue?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast({ title: 'Group deleted' }); router.push('/groups') }
      else toast({ title: data.message || 'Failed', variant: "destructive" })
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Group Name</label>
          <input {...form.register('name')} className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors" />
          {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
          <select {...form.register('subject')} className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none appearance-none">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Description</label>
          <textarea {...form.register('description')} rows={3} className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm focus:border-primary/50 focus:outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Privacy</label>
          <div className="grid grid-cols-3 gap-2">
            {(['PUBLIC', 'PRIVATE', 'INVITE_ONLY'] as const).map(p => (
              <label key={p} className="flex flex-col items-center p-3 rounded-xl border border-border/50 cursor-pointer text-center hover:border-primary/30 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                <input type="radio" {...form.register('privacy')} value={p} className="sr-only" />
                <span className="text-xs font-medium">{p.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mb-4">Deleting this group is permanent and will remove all members, materials, and chat history.</p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-all"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Group
          </button>
        </div>
      )}
    </div>
  )
}
