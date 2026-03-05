'use client'
// src/app/(dashboard)/groups/[groupId]/page.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { GroupHeader } from '@/components/groups/group-header'
import { GroupTabs } from '@/components/groups/group-tabs'
import { GroupChat } from '@/components/groups/group-chat'
import { SharedMaterialsList } from '@/components/groups/shared-materials-list'
import { MemberList, MemberListSkeleton } from '@/components/groups/member-list'
import { JoinRequestList } from '@/components/groups/join-request-list'
import { MaterialShareModal } from '@/components/groups/material-share-modal'
import { InviteModal } from '@/components/groups/invite-modal'
import { useGroupMembers } from '@/hooks/use-group-members'
import { Plus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function GroupDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const fetchGroup = async () => {
    const res = await fetch(`/api/groups/${groupId}`)
    const data = await res.json()
    if (data.success) setGroup(data.data)
    setLoading(false)
  }

  const fetchMaterials = async (resolvedId: string = groupId) => {
    const res = await fetch(`/api/groups/${resolvedId}/materials`)
    const data = await res.json()
    if (data.success) setMaterials(data.data)
  }

  const fetchRequests = async (resolvedId: string = groupId) => {
    if (!group?.myMembership || !['OWNER', 'ADMIN'].includes(group.myMembership.role)) return
    const res = await fetch(`/api/groups/${resolvedId}/requests`)
    const data = await res.json()
    if (data.success) setRequests(data.data)
  }

  useEffect(() => { fetchGroup() }, [groupId])
  useEffect(() => { if (group?.myMembership) { fetchMaterials(group.id); fetchRequests(group.id) } }, [group])

  const { members, loading: membersLoading, refetch: refetchMembers } = useGroupMembers(group?.id || groupId, session)

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.success) { toast({ title: data.message }); fetchGroup() }
      else toast({ title: data.message || 'Failed to join', variant: "destructive" })
    } finally { setJoining(false) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }
  if (!group) {
    return <div className="flex items-center justify-center h-96 text-muted-foreground">Group not found</div>
  }

  const userId = session?.user?.id || ''
  const myRole = group.myMembership?.role ?? null
  const isAdmin = myRole === 'OWNER' || myRole === 'ADMIN'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <GroupHeader
        group={group}
        myRole={myRole}
        onJoin={handleJoin}
        joinPending={joining}
        onInvite={() => setShowInviteModal(true)}
      />

      {myRole ? (
        <GroupTabs
          showRequests={isAdmin}
          requestCount={requests.length}
        >
          {(tab) => (
            <>
              {tab === 'chat' && (
                <GroupChat
                  groupId={group.id}
                  currentUserId={userId}
                  currentUserName={session?.user?.name ?? ''}
                  currentUserAvatar={session?.user?.image ?? ''}
                />
              )}
              {tab === 'materials' && (
                <div className="space-y-4">
                  {isAdmin || myRole === 'MEMBER' ? (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                      >
                        <Plus className="h-4 w-4" /> Share Material
                      </button>
                    </div>
                  ) : null}
                  <SharedMaterialsList
                    materials={materials}
                    currentUserId={userId}
                    canManage={isAdmin}
                    groupId={group.id}
                    onRefresh={() => fetchMaterials(group.id)}
                  />
                </div>
              )}
              {tab === 'members' && (
                membersLoading ? <MemberListSkeleton /> : (
                  <MemberList
                    members={members}
                    currentUserId={userId}
                    currentUserRole={myRole}
                    groupId={group.id}
                    onRefresh={refetchMembers}
                  />
                )
              )}
              {tab === 'about' && (
                <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{group.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Created by</h3>
                    <p className="text-sm text-muted-foreground">{group.creator?.name}</p>
                  </div>
                </div>
              )}
              {tab === 'requests' && isAdmin && (
                <JoinRequestList requests={requests} groupId={group.id} onRefresh={() => { fetchRequests(group.id); fetchGroup() }} />
              )}
            </>
          )}
        </GroupTabs>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-lg font-semibold mb-1">Join this group to see content</p>
          <p className="text-sm text-muted-foreground">Members have access to chat, materials, and more.</p>
        </div>
      )}

      {showShareModal && <MaterialShareModal groupId={group.id} onClose={() => setShowShareModal(false)} onShared={() => fetchMaterials(group.id)} />}
      {showInviteModal && <InviteModal groupId={group.id} onClose={() => setShowInviteModal(false)} />}
    </div>
  )
}
