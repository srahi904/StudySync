// src/app/api/groups/[id]/chat/route.ts
// Group chat using Pusher (stored in DB for history)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveGroupId } from '@/lib/resolvers'
import { checkGroupPermissions } from '@/lib/groups/permissions'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

// Chat messages use the PublicMessage model repurposed with a special channelId
// We create a virtual channel ID = "group-{groupId}" in the PublicChannel table

async function getOrCreateGroupChatChannel(groupId: string, groupName: string) {
  const virtualId = `group-${groupId}`
  let channel = await prisma.publicChannel.findFirst({ where: { name: virtualId } })
  if (!channel) {
    channel = await prisma.publicChannel.create({
      data: { name: virtualId, topic: `Group chat for ${groupName}`, isActive: true },
    })
    await prisma.studyGroup.update({ where: { id: groupId }, data: { chatChannelId: channel.id } })
  }
  return channel
}

// GET: Paginated chat history
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.role) return NextResponse.json({ success: false, message: 'Not a member' }, { status: 403 })

    const { searchParams } = req.nextUrl
    const cursor = searchParams.get('cursor') || undefined
    const limit = 50

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true, chatChannelId: true } })
    if (!group) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const channel = await getOrCreateGroupChatChannel(groupId, group.name)

    const messages = await prisma.publicMessage.findMany({
      where: {
        channelId: channel.id,
        isDeleted: false,
        ...(cursor && { id: { lt: cursor } }),
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: messages.reverse(),
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    })
  } catch (error) {
    console.error('[GROUP_CHAT_GET_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST: Send message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.role) return NextResponse.json({ success: false, message: 'Not a member' }, { status: 403 })

    const body = await req.json()
    const content = (body.content as string)?.trim()
    if (!content || content.length > 2000) {
      return NextResponse.json({ success: false, message: 'Message content is required (max 2000 chars)' }, { status: 400 })
    }

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } })
    if (!group) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const channel = await getOrCreateGroupChatChannel(groupId, group.name)

    const message = await prisma.publicMessage.create({
      data: {
        channelId: channel.id,
        senderId: userId,
        content,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Update member's last active time
    await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { lastActiveAt: new Date() },
    }).catch(() => {})

    // Broadcast to group channel
    await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_CHAT_MESSAGE, {
      groupId,
      message,
    })

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    console.error('[GROUP_CHAT_POST_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 })
  }
}
