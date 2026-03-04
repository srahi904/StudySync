'use client'
// src/app/(dashboard)/groups/[groupId]/settings/page.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Settings } from 'lucide-react'
import { GroupSettingsForm } from '@/components/groups/group-settings-form'
import { useRouter } from 'next/navigation'

export default function GroupSettingsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const groupId = params.groupId as string
  const router = useRouter()

  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/groups/${groupId}`).then(r => r.json()).then(d => {
      if (!d.success) { router.push(`/groups/${groupId}`); return }
      const g = d.data
      // Must be owner or admin
      if (!g.myMembership || !['OWNER', 'ADMIN'].includes(g.myMembership.role)) {
        router.push(`/groups/${groupId}`)
        return
      }
      setGroup(g)
    }).finally(() => setLoading(false))
  }, [groupId])

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Group Settings</h1>
          <p className="text-sm text-muted-foreground">{group?.name}</p>
        </div>
      </div>
      {group && (
        <GroupSettingsForm
          group={group}
          isOwner={group.myMembership?.role === 'OWNER'}
        />
      )}
    </div>
  )
}
