// src/app/api/groups/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { checkGroupPermissions, invalidateGroupPermissions } from '@/lib/groups/permissions'
import { UpdateMemberRoleSchema } from '@/lib/validations'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

// ── PATCH: Change member role ─────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId, userId: targetUserId } = await params
    const actorId = session.user.id

    const actorPerms = await checkGroupPermissions(groupId, actorId)
    if (!actorPerms.canManageMembers) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 })

    const body = await req.json()
    const result = UpdateMemberRoleSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ success: false, errors: result.error.flatten().fieldErrors }, { status: 400 })

    const { role } = result.data

    // Cannot demote the owner
    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    })
    if (!targetMember) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 })
    if (targetMember.role === 'OWNER') return NextResponse.json({ success: false, message: 'Cannot change owner role' }, { status: 403 })

    // Non-owners can't promote to admin unless they are owner
    if (role === 'ADMIN' && actorPerms.role !== 'OWNER') {
      return NextResponse.json({ success: false, message: 'Only owner can promote to admin' }, { status: 403 })
    }

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    await invalidateGroupPermissions(groupId, targetUserId)

    await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MEMBER_UPDATED, {
      groupId,
      userId: targetUserId,
      role,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[MEMBER_ROLE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to update role' }, { status: 500 })
  }
}

// ── DELETE: Remove member ─────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId, userId: targetUserId } = await params
    const actorId = session.user.id

    const actorPerms = await checkGroupPermissions(groupId, actorId)
    if (!actorPerms.canManageMembers) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 })

    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    })
    if (!targetMember) return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 })
    if (targetMember.role === 'OWNER') return NextResponse.json({ success: false, message: 'Cannot remove the owner' }, { status: 403 })

    // Non-owner admins can't remove other admins
    if (targetMember.role === 'ADMIN' && actorPerms.role !== 'OWNER') {
      return NextResponse.json({ success: false, message: 'Only owner can remove admins' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } })
      await tx.studyGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } })
    })

    await cache.del(`group:${groupId}`)
    await cache.del(`user:${targetUserId}:groups`)
    await invalidateGroupPermissions(groupId, targetUserId)

    await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MEMBER_LEFT, {
      groupId,
      userId: targetUserId,
      removed: true,
    })

    return NextResponse.json({ success: true, message: 'Member removed' })
  } catch (error) {
    console.error('[MEMBER_REMOVE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to remove member' }, { status: 500 })
  }
}
