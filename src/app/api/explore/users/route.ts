// src/app/api/explore/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Search users by name
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        image: true,
        bio: true,
        university: true,
        followersCount: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    // Check which users the current user follows
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: users.map((u) => u.id) },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(followingIds.map((f) => f.followingId));

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        isFollowing: followingSet.has(u.id),
      })),
    });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
