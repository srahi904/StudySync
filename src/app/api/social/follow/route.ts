// src/app/api/social/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { createNotification } from '@/lib/notifications';

// POST: Toggle follow/unfollow
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
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.$transaction([
        prisma.follow.delete({
          where: { id: existingFollow.id },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUserId },
          data: { followersCount: { decrement: 1 } },
        }),
      ]);

      // Notify target user
      await triggerPusherEvent(
        CHANNELS.user(targetUserId),
        EVENTS.UNFOLLOWED,
        { userId: session.user.id }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        following: false,
        message: 'Unfollowed successfully',
      });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId: session.user.id,
            followingId: targetUserId,
          },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { followingCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUserId },
          data: { followersCount: { increment: 1 } },
        }),
      ]);

      await createNotification({
        userId: targetUserId,
        actorId: session.user.id,
        type: 'FOLLOW',
        content: `${session.user.name} started following you`,
        link: `/profile/${session.user.id}`,
      });

      // Still trigger the specific NEW_FOLLOWER event for active live lists
      await triggerPusherEvent(
        CHANNELS.user(targetUserId),
        EVENTS.NEW_FOLLOWER,
        {
          userId: session.user.id,
          name: session.user.name,
          avatar: session.user.avatar || session.user.image,
        }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        following: true,
        message: 'Followed successfully',
      });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}

// GET: Check follow status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    // Check if mutual follow
    const reverseFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      following: !!follow,
      followedBy: !!reverseFollow,
      mutual: !!follow && !!reverseFollow,
    });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}
