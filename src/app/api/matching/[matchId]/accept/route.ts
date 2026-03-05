// POST /api/matching/[matchId]/accept
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId: targetUserId } = await params
    const userId = session.user.id

    // Sort IDs so user1Id < user2Id for uniqueness
    const [user1Id, user2Id] = [userId, targetUserId].sort()

    // Create or update the match
    const match = await prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      update: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      create: {
        user1Id,
        user2Id,
        score: 0,
        status: 'ACCEPTED',
        initiatedBy: userId,
        respondedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Auto-create a private conversation if it doesn't exist
    const [convUser1, convUser2] = [userId, targetUserId].sort()
    let conversation = await prisma.privateConversation.findUnique({
      where: { user1Id_user2Id: { user1Id: convUser1, user2Id: convUser2 } },
    })

    if (!conversation) {
      conversation = await prisma.privateConversation.create({
        data: { user1Id: convUser1, user2Id: convUser2 },
      })
    }

    // Update match with conversation ID
    await prisma.match.update({
      where: { id: match.id },
      data: { chatConversationId: conversation.id },
    })

    // Create notification for the other user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        actorId: userId,
        type: 'SYSTEM',
        content: `${session.user.name || 'Someone'} accepted your study match! Start chatting now.`,
        link: '/chat',
      },
    })

    return NextResponse.json({ success: true, conversationId: conversation.id })
  } catch (error) {
    console.error('[MATCH_ACCEPT]', error)
    return NextResponse.json({ error: 'Failed to accept match' }, { status: 500 })
  }
}
