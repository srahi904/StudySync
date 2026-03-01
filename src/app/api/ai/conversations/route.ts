import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {                          
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-delete conversations older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.aiConversation.deleteMany({
      where: {
        userId: session.user.id,
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        materialIds: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },     
      { status: 500 }
    );
  }
}