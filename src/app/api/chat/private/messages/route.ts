// src/app/api/chat/private/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';

// GET: Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify user is part of conversation
    const conversation = await prisma.privateConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await prisma.privateMessage.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    // Mark unread messages as read
    const unreadIds = data
      .filter((m) => m.senderId !== session.user.id && !m.isRead)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await prisma.privateMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true, readAt: new Date(), status: 'READ' },
      });

      // Notify sender that messages were read
      const otherUserId = conversation.user1Id === session.user.id
        ? conversation.user2Id
        : conversation.user1Id;

      await triggerPusherEvent(
        CHANNELS.dm(session.user.id, otherUserId),
        EVENTS.MESSAGE_READ,
        { conversationId, readBy: session.user.id, messageIds: unreadIds }
      ).catch(() => {});
    }

    return NextResponse.json({
      messages: data.reverse(),
      nextCursor: hasMore ? data[0].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('Fetch private messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a private message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content, attachments } = await request.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Verify user is part of conversation
    const conversation = await prisma.privateConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id)) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.privateMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim(),
        attachments: attachments || null,
        status: 'SENT',
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, image: true } },
      },
    });

    // Update conversation last message
    await prisma.privateConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        lastMessageText: content.trim().substring(0, 100),
      },
    });

    // Determine other user
    const otherUserId = conversation.user1Id === session.user.id
      ? conversation.user2Id
      : conversation.user1Id;

    // Trigger real-time event on DM channel
    await triggerPusherEvent(
      CHANNELS.dm(session.user.id, otherUserId),
      EVENTS.NEW_PRIVATE_MESSAGE,
      {
        id: message.id,
        conversationId,
        content: message.content,
        attachments: message.attachments,
        sender: message.sender,
        status: message.status,
        createdAt: message.createdAt,
      }
    ).catch(() => {});

    // Also notify on user's personal channel (for conversation list updates)
    await triggerPusherEvent(
      CHANNELS.user(otherUserId),
      EVENTS.CONVERSATION_UPDATED,
      {
        conversationId,
        lastMessage: content.trim().substring(0, 100),
        lastMessageAt: message.createdAt,
        senderId: session.user.id,
        senderName: session.user.name,
      }
    ).catch(() => {});

    // And notify the sender's personal channel so their own sidebar updates immediately
    await triggerPusherEvent(
      CHANNELS.user(session.user.id),
      EVENTS.CONVERSATION_UPDATED,
      {
        conversationId,
        lastMessage: content.trim().substring(0, 100),
        lastMessageAt: message.createdAt,
        senderId: session.user.id,
        senderName: session.user.name,
      }
    ).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send private message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
