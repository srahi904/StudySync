import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { MessageStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Mark all unread messages from the OTHER user as read
    const unreadMessages = await prisma.privateMessage.findMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      select: { id: true }
    });

    const unreadIds = unreadMessages.map(m => m.id);

    if (unreadIds.length > 0) {
      await prisma.privateMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true, readAt: new Date(), status: MessageStatus.READ },
      });

      // Get the conversation to find the other user's ID
      const conversation = await prisma.privateConversation.findUnique({
        where: { id: conversationId },
        select: { user1Id: true, user2Id: true }
      });

      if (conversation) {
        const otherUserId = conversation.user1Id === session.user.id
          ? conversation.user2Id
          : conversation.user1Id;

        // Notify sender that messages were read
        await triggerPusherEvent(
          CHANNELS.dm(session.user.id, otherUserId),
          EVENTS.MESSAGE_READ,
          { conversationId, readBy: session.user.id, messageIds: unreadIds }
        ).catch(() => {});

        // Notify the user themselves to update their sidebar badge instantly
        await triggerPusherEvent(
          CHANNELS.user(session.user.id),
          EVENTS.MESSAGE_READ,
          { conversationId }
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, count: unreadIds.length });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
