// src/app/api/groups/[id]/leave/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { resolveGroupId } from '@/lib/resolvers'
import { invalidateGroupPermissions } from '@/lib/groups/permissions'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })

    if (!member) return NextResponse.json({ success: false, message: 'You are not a member of this group' }, { status: 404 })

    // Owners cannot leave unless they transfer or are the last member
    if (member.role === 'OWNER') {
      const otherAdmins = await prisma.groupMember.count({
        where: { groupId, role: { in: ['ADMIN'] }, userId: { not: userId } },
      })
      if (otherAdmins === 0) {
        const otherMembers = await prisma.groupMember.count({
          where: { groupId, userId: { not: userId } },
        })
        if (otherMembers > 0) {
          return NextResponse.json({
            success: false,
            message: 'Transfer ownership or promote an admin before leaving',
          }, { status: 400 })
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({ where: { groupId_userId: { groupId, userId } } })
      await tx.studyGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } })
    })

    // Invalidate caches
    await cache.del(`group:${groupId}`)
    await cache.del(`user:${userId}:groups`)
    await invalidateGroupPermissions(groupId, userId)

    // Broadcast
    await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MEMBER_LEFT, {
      groupId,
      userId,
    })

    return NextResponse.json({ success: true, message: 'Left the group' })
  } catch (error) {
    console.error('[GROUP_LEAVE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to leave group' }, { status: 500 })
  }
}
