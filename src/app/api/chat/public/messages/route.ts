// src/app/api/chat/public/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';

// GET: Fetch messages for a channel (cursor-based pagination)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    const messages = await prisma.publicMessage.findMany({
      where: {
        channelId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return NextResponse.json({
      messages: data.reverse(), // Return in chronological order
      nextCursor: hasMore ? data[0].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a message to a public channel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId, content, attachments } = await request.json();

    if (!channelId || !content?.trim()) {
      return NextResponse.json({ error: 'Channel ID and content required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Verify channel exists
    const channel = await prisma.publicChannel.findUnique({ where: { id: channelId } });
    if (!channel || !channel.isActive) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Create message with 30-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const message = await prisma.publicMessage.create({
      data: {
        channelId,
        senderId: session.user.id,
        content: content.trim(),
        attachments: attachments || null,
        expiresAt,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
      },
    });

    // Trigger real-time event
    await triggerPusherEvent(
      CHANNELS.publicChannel(channelId),
      EVENTS.NEW_PUBLIC_MESSAGE,
      {
        id: message.id,
        content: message.content,
        attachments: message.attachments,
        sender: message.sender,
        createdAt: message.createdAt,
      }
    ).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
