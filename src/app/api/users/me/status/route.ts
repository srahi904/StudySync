import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();
    const { isOnline } = body;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline: Boolean(isOnline),
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update online status error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
