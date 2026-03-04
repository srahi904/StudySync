// src/app/api/groups/[id]/requests/[requestId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { checkGroupPermissions } from '@/lib/groups/permissions'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId, requestId } = await params
    const reviewerId = session.user.id

    const perms = await checkGroupPermissions(groupId, reviewerId)
    if (!perms.canApproveRequests) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 })

    const body = await req.json()
    const action = body.action as 'approve' | 'reject'
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const joinRequest = await prisma.groupJoinRequest.findUnique({ where: { id: requestId } })
    if (!joinRequest || joinRequest.groupId !== groupId) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 })
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: 'Request already reviewed' }, { status: 409 })
    }

    if (action === 'approve') {
      const group = await prisma.studyGroup.findUnique({
        where: { id: groupId },
        select: { memberCount: true, maxMembers: true, name: true },
      })

      if (group && group.memberCount >= group.maxMembers) {
        return NextResponse.json({ success: false, message: 'Group is full' }, { status: 409 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.groupJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date() },
        })
        await tx.groupMember.create({
          data: { groupId, userId: joinRequest.userId, role: 'MEMBER' },
        })
        await tx.studyGroup.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } })
      })

      await cache.del(`group:${groupId}`)
      await cache.del(`user:${joinRequest.userId}:groups`)

      const group2 = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } })

      // Notify the requester
      await createNotification({
        userId: joinRequest.userId,
        actorId: reviewerId,
        type: 'SYSTEM',
        content: `Your request to join "${group2?.name}" was approved!`,
        link: `/groups/${groupId}`,
      })

      const newMember = await prisma.user.findUnique({
        where: { id: joinRequest.userId },
        select: { id: true, name: true, avatar: true },
      })
      await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MEMBER_JOINED, {
        groupId,
        member: newMember,
      })
      await triggerPusherEvent(CHANNELS.user(joinRequest.userId), EVENTS.GROUP_UPDATED, { groupId, approved: true })

      return NextResponse.json({ success: true, message: 'Request approved' })
    } else {
      await prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', reviewedBy: reviewerId, reviewedAt: new Date() },
      })
      return NextResponse.json({ success: true, message: 'Request rejected' })
    }
  } catch (error) {
    console.error('[REQUEST_REVIEW_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to review request' }, { status: 500 })
  }
}
