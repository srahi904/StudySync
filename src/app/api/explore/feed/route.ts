// src/app/api/explore/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Explore feed — discover public materials and users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'materials'; // 'materials' or 'users'

    if (type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          image: true,
          bio: true,
          university: true,
          major: true,
          subjects: true,
          followersCount: true,
          followingCount: true,
        },
        orderBy: { followersCount: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasMore = users.length > limit;
      const data = hasMore ? users.slice(0, limit) : users;

      // Check which users the current user follows
      const followingIds = await prisma.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: { in: data.map((u) => u.id) },
        },
        select: { followingId: true },
      });

      const followingSet = new Set(followingIds.map((f) => f.followingId));

      return NextResponse.json({
        items: data.map((u) => ({
          ...u,
          isFollowing: followingSet.has(u.id),
        })),
        nextCursor: hasMore ? data[data.length - 1].id : null,
        hasMore,
      });
    }

    // Default: public materials
    const materials = await prisma.material.findMany({
      where: {
        visibility: 'PUBLIC',
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            university: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = materials.length > limit;
    const data = hasMore ? materials.slice(0, limit) : materials;

    return NextResponse.json({
      items: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('Explore feed error:', error);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
