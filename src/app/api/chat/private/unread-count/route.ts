import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const userId = session.user.id;

    const unreadCount = await prisma.privateMessage.count({
      where: {
        senderId: { not: userId },
        isRead: false,
        conversation: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Unread count fetch error:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
