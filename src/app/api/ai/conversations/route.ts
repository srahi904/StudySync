import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

function parseLimit(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get('limit');
  const parsed = Number(raw ?? DEFAULT_LIMIT);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {                          
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseLimit(request);

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: session.user.id, isArchived: false },
      orderBy: [
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        materialIds: true,
        lastMessageAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      conversations,
      {
        headers: {
          // User-specific data: prevent shared/proxy caching, but allow fast browser revalidation.
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },     
      { status: 500 }
    );
  }
}
