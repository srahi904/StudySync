// src/app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { resolveGroupId } from '@/lib/resolvers'
import { checkGroupPermissions } from '@/lib/groups/permissions'
import { UpdateGroupSchema } from '@/lib/validations'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

// ── GET: Group detail ───────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const id = await resolveGroupId(paramId)
    if (!id) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const group = await cache.get(
      `group:${id}`,
      () => prisma.studyGroup.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, materials: true } },
        },
      }),
      120 // 2 min cache
    )

    if (!group) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    // Get the current user's membership info
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
      select: { role: true, joinedAt: true },
    })

    // Check pending request
    const pendingRequest = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    })

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...group, 
        myMembership: membership,
        hasPendingRequest: pendingRequest?.status === 'PENDING'
      } 
    })
  } catch (error) {
    console.error('[GROUP_GET_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch group' }, { status: 500 })
  }
}

// ── PATCH: Update group ─────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const id = await resolveGroupId(paramId)
    if (!id) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const perms = await checkGroupPermissions(id, userId)
    if (!perms.canEdit) return NextResponse.json({ success: false, message: 'Not authorized to edit this group' }, { status: 403 })

    const body = await req.json()
    const result = UpdateGroupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const updated = await prisma.studyGroup.update({ where: { id }, data: result.data })

    // Invalidate group cache
    await cache.del(`group:${id}`)

    // Notify members of update
    await triggerPusherEvent(CHANNELS.group(id), EVENTS.GROUP_UPDATED, { groupId: id })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[GROUP_PATCH_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to update group' }, { status: 500 })
  }
}

// ── DELETE: Delete group ────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const id = await resolveGroupId(paramId)
    if (!id) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const perms = await checkGroupPermissions(id, userId)
    if (!perms.canDelete) return NextResponse.json({ success: false, message: 'Only the owner can delete this group' }, { status: 403 })

    await prisma.studyGroup.delete({ where: { id } })
    await cache.del(`group:${id}`)

    return NextResponse.json({ success: true, message: 'Group deleted' })
  } catch (error) {
    console.error('[GROUP_DELETE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to delete group' }, { status: 500 })
  }
}
