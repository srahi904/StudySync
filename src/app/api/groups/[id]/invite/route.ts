// src/app/api/groups/[id]/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveGroupId } from '@/lib/resolvers'
import { checkGroupPermissions } from '@/lib/groups/permissions'
import { InviteUserSchema } from '@/lib/validations'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { addMinutes } from '@/lib/utils'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const actorId = session.user.id

    const perms = await checkGroupPermissions(groupId, actorId)
    if (!perms.role) return NextResponse.json({ success: false, message: 'Not a member' }, { status: 403 })
    if (!perms.canInvite) return NextResponse.json({ success: false, message: 'Not allowed to invite' }, { status: 403 })

    const body = await req.json()
    const result = InviteUserSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ success: false, errors: result.error.flatten().fieldErrors }, { status: 400 })

    const { userId: inviteeId } = result.data

    // Cannot invite yourself
    if (inviteeId === actorId) return NextResponse.json({ success: false, message: 'Cannot invite yourself' }, { status: 400 })

    // Check if already a member
    const alreadyMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviteeId } },
    })
    if (alreadyMember) return NextResponse.json({ success: false, message: 'User is already a member' }, { status: 409 })

    // Upsert invitation
    const invitation = await prisma.groupInvitation.upsert({
      where: { groupId_invitedUserId: { groupId, invitedUserId: inviteeId } },
      update: { status: 'PENDING', invitedBy: actorId, expiresAt: addMinutes(new Date(), 60 * 24 * 7) },
      create: {
        groupId,
        invitedUserId: inviteeId,
        invitedBy: actorId,
        status: 'PENDING',
        expiresAt: addMinutes(new Date(), 60 * 24 * 7), // 7 days
      },
    })

    // Notify the invited user
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } })
    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } })

    await createNotification({
      userId: inviteeId,
      actorId,
      type: 'GROUP_INVITE',
      content: `${actor?.name} invited you to join "${group?.name}"`,
      link: `/groups/invitations`,
    })

    await triggerPusherEvent(CHANNELS.user(inviteeId), EVENTS.GROUP_INVITATION, {
      invitation,
      groupName: group?.name,
      inviterName: actor?.name,
    })

    return NextResponse.json({ success: true, data: invitation }, { status: 201 })
  } catch (error) {
    console.error('[GROUP_INVITE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to send invitation' }, { status: 500 })
  }
}
