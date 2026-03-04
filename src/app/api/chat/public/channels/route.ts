// src/app/api/chat/public/channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const allChannels = await prisma.publicChannel.findMany({
      where: { isActive: true, isArchived: false },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    const regularChannels = [];
    const groupChannelMap = new Map();
    const groupIds: string[] = [];

    for (const ch of allChannels) {
      if (ch.name.startsWith('group-')) {
        const groupId = ch.name.replace('group-', '');
        groupIds.push(groupId);
        groupChannelMap.set(groupId, ch);
      } else {
        regularChannels.push(ch);
      }
    }

    const allowedGroupChannels = [];

    if (groupIds.length > 0) {
      const groups = await prisma.studyGroup.findMany({
        where: {
          id: { in: groupIds },
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          privacy: true,
          members: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      for (const group of groups) {
        if (group.members.length > 0) {
          const ch = groupChannelMap.get(group.id);
          if (ch) {
            allowedGroupChannels.push({ ...ch, name: group.name });
          }
        }
      }
    }

    const finalChannels = [...regularChannels, ...allowedGroupChannels];
    finalChannels.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ channels: finalChannels });
  } catch (error) {
    console.error('Channels error:', error);
    return NextResponse.json({ error: 'Failed to get channels' }, { status: 500 });
  }
}

// POST: Create a new public channel (seed default channels)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, topic, subject } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Channel name required' }, { status: 400 });
    }

    // Check if channel already exists to prevent duplicates
    let channel = await prisma.publicChannel.findFirst({
      where: { name },
    });

    if (!channel) {
      channel = await prisma.publicChannel.create({
        data: { name, topic, subject },
      });
    }

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
