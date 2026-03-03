// src/app/api/social/followers/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'followers'; // 'followers' or 'following'
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { followersCount: true, followingCount: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'followers') {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              image: true,
              bio: true,
              university: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasMore = followers.length > limit;
      const data = hasMore ? followers.slice(0, limit) : followers;

      return NextResponse.json({
        users: data.map((f) => f.follower),
        nextCursor: hasMore ? data[data.length - 1].id : null,
        total: user.followersCount,
      });
    } else {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              image: true,
              bio: true,
              university: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasMore = following.length > limit;
      const data = hasMore ? following.slice(0, limit) : following;

      return NextResponse.json({
        users: data.map((f) => f.following),
        nextCursor: hasMore ? data[data.length - 1].id : null,
        total: user.followingCount,
      });
    }
  } catch (error) {
    console.error('Followers list error:', error);
    return NextResponse.json({ error: 'Failed to get followers' }, { status: 500 });
  }
}
