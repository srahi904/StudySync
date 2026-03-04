// src/app/api/groups/invitations/[invitationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { GroupRole, InvitationStatus } from '@prisma/client'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { invitationId } = await params
    const userId = session.user.id

    const body = await req.json()
    const action = body.action as 'accept' | 'reject'
    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'action must be "accept" or "reject"' }, { status: 400 })
    }

    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId },
      include: { group: { select: { id: true, name: true, memberCount: true, maxMembers: true } } },
    })

    if (!invitation || invitation.invitedUserId !== userId) {
      return NextResponse.json({ success: false, message: 'Invitation not found' }, { status: 404 })
    }
    if (invitation.status !== InvitationStatus.PENDING || invitation.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Invitation is expired or already handled' }, { status: 409 })
    }

    if (action === 'accept') {
      if (invitation.group.memberCount >= invitation.group.maxMembers) {
        return NextResponse.json({ success: false, message: 'Group is full' }, { status: 409 })
      }

      const alreadyMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: invitation.groupId, userId } },
      })

      if (!alreadyMember) {
        await prisma.$transaction(async (tx) => {
          await tx.groupMember.create({ data: { groupId: invitation.groupId, userId, role: GroupRole.MEMBER } })
          await tx.studyGroup.update({ where: { id: invitation.groupId }, data: { memberCount: { increment: 1 } } })
          await tx.groupInvitation.update({ where: { id: invitationId }, data: { status: InvitationStatus.ACCEPTED } })
        })
      } else {
        await prisma.groupInvitation.update({ where: { id: invitationId }, data: { status: InvitationStatus.ACCEPTED } })
      }

      await cache.del(`group:${invitation.groupId}`)
      await cache.del(`user:${userId}:groups`)

      const newMember = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, avatar: true } })
      await triggerPusherEvent(CHANNELS.group(invitation.groupId), EVENTS.GROUP_MEMBER_JOINED, {
        groupId: invitation.groupId,
        member: newMember,
      })

      return NextResponse.json({ success: true, message: `Joined "${invitation.group.name}"!` })
    } else {
      await prisma.groupInvitation.update({ where: { id: invitationId }, data: { status: InvitationStatus.REJECTED } })
      return NextResponse.json({ success: true, message: 'Invitation declined' })
    }
  } catch (error) {
    console.error('[INVITATION_HANDLE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to handle invitation' }, { status: 500 })
  }
}
