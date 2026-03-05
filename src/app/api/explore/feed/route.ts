// src/app/api/explore/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getCachedUsers = unstable_cache(
  async (limit: number, cursor: string | null) => {
    return prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
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
      take: limit + 5, // Take extra to account for filtering current user
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },
  ['explore-feed-users'],
  { revalidate: 60 }
);

const getCachedMaterials = unstable_cache(
  async (limit: number, cursor: string | null) => {
    return prisma.material.findMany({
      where: {
        visibility: 'PUBLIC',
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true, image: true, university: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },
  ['explore-feed-materials'],
  { revalidate: 60 }
);

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
      const allUsers = await getCachedUsers(limit, cursor);
      const filteredUsers = allUsers.filter(u => u.id !== session.user.id);
      
      const hasMore = filteredUsers.length > limit;
      const data = hasMore ? filteredUsers.slice(0, limit) : filteredUsers;

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
    const materials = await getCachedMaterials(limit, cursor);

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
