// src/app/api/chat/typing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';

// POST: Trigger typing indicator (no DB save - ephemeral)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelType, channelId, targetUserId, isTyping } = await request.json();

    const event = isTyping ? EVENTS.TYPING_START : EVENTS.TYPING_STOP;
    const data = {
      userId: session.user.id,
      name: session.user.name,
    };

    if (channelType === 'public') {
      await triggerPusherEvent(
        CHANNELS.publicChannel(channelId),
        event,
        data
      );
    } else if (channelType === 'private' && targetUserId) {
      await triggerPusherEvent(
        CHANNELS.dm(session.user.id, targetUserId),
        event,
        data
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Typing indicator error:', error);
    return NextResponse.json({ error: 'Failed to send typing indicator' }, { status: 500 });
  }
}
