// src/app/api/groups/[id]/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { resolveGroupId } from '@/lib/resolvers'
import { notifyGroupAdmins, notifyGroupMembers } from '@/lib/groups/notifications'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { createNotification } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const body = await req.json().catch(() => ({}))
    const message = body.message as string | undefined

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, privacy: true, maxMembers: true, memberCount: true },
    })

    if (!group) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })
    if (group.memberCount >= group.maxMembers) {
      return NextResponse.json({ success: false, message: 'Group is full' }, { status: 409 })
    }

    // Check already a member
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (existing) return NextResponse.json({ success: false, message: 'Already a member' }, { status: 409 })

    // Check invite-only
    if (group.privacy === 'INVITE_ONLY') {
      const invitation = await prisma.groupInvitation.findUnique({
        where: { groupId_invitedUserId: { groupId, invitedUserId: userId } },
      })
      if (!invitation || invitation.status !== 'PENDING') {
        return NextResponse.json({ success: false, message: 'This group is invite-only' }, { status: 403 })
      }
    }

    if (group.privacy === 'PUBLIC' || group.privacy === 'INVITE_ONLY') {
      // Direct join
      const member = await prisma.$transaction(async (tx) => {
        const m = await tx.groupMember.create({
          data: { groupId, userId, role: 'MEMBER' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        })
        await tx.studyGroup.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } })
        // Accept invitation if any
        await tx.groupInvitation.updateMany({
          where: { groupId, invitedUserId: userId, status: 'PENDING' },
          data: { status: 'ACCEPTED' },
        })
        return m
      })

      // Invalidate caches
      await cache.del(`group:${groupId}`)
      await cache.del(`user:${userId}:groups`)

      // Realtime broadcast
      await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MEMBER_JOINED, {
        groupId,
        member: member.user,
      })

      // Notify other members
      await notifyGroupMembers({
        groupId,
        groupName: group.name,
        actorId: userId,
        type: 'SYSTEM',
        content: `${member.user.name} joined the group`,
        link: `/groups/${groupId}`,
        excludeUserId: userId,
      })

      return NextResponse.json({ success: true, message: 'Joined group!', data: member })
    }

    // PRIVATE: create join request
    const existingRequest = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (existingRequest) {
      return NextResponse.json({ success: false, message: 'Join request already pending' }, { status: 409 })
    }

    const joinRequest = await prisma.groupJoinRequest.create({
      data: { groupId, userId, message, status: 'PENDING' },
    })

    // Notify admins
    const admins = await prisma.groupMember.findMany({
      where: { groupId, role: { in: ['OWNER', 'ADMIN'] } },
      select: { userId: true },
    })
    
    // ...
    await Promise.all(admins.map((admin: { userId: string }) => 
      createNotification({
        userId: admin.userId,
        actorId: userId,
        type: 'JOIN_REQUEST' as NotificationType,
        content: 'Someone requested to join your group',
        link: `/groups/${groupId}?tab=members`,
      })
    ))

    return NextResponse.json({ success: true, message: 'Join request sent!', data: joinRequest }, { status: 201 })
  } catch (error) {
    console.error('[GROUP_JOIN_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to join group' }, { status: 500 })
  }
}
