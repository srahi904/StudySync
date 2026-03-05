// src/app/api/chat/private/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: List private conversations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await prisma.privateConversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true, lastSeenAt: true },
        },
        user2: {
          select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true, lastSeenAt: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, senderId: true, isRead: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Count unread messages for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.privateMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.messages[0] || null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          createdAt: conv.createdAt,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

// POST: Create or find a conversation with a user (requires mutual follow)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check mutual follow
    const [follow1, follow2] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetUserId,
          },
        },
      }),
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: session.user.id,
          },
        },
      }),
    ]);

    if (!follow1 || !follow2) {
      return NextResponse.json(
        { error: 'Both users must follow each other to start a conversation' },
        { status: 403 }
      );
    }

    // Sort user IDs to ensure consistent lookup
    const [user1Id, user2Id] = [session.user.id, targetUserId].sort();

    // Find existing conversation
    let conversation = await prisma.privateConversation.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      include: {
        user1: { select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true } },
        user2: { select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.privateConversation.create({
        data: { user1Id, user2Id },
        include: {
          user1: { select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true } },
          user2: { select: { id: true, name: true, username: true, avatar: true, image: true, isOnline: true } },
        },
      });
    }

    const otherUser = conversation.user1Id === session.user.id
      ? conversation.user2
      : conversation.user1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
