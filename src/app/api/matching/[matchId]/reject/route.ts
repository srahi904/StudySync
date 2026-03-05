// POST /api/matching/[matchId]/reject
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
    const [user1Id, user2Id] = [userId, targetUserId].sort()

    await prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      update: { status: 'REJECTED', respondedAt: new Date() },
      create: {
        user1Id, user2Id,
        score: 0,
        status: 'REJECTED',
        initiatedBy: userId,
        respondedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MATCH_REJECT]', error)
    return NextResponse.json({ error: 'Failed to reject match' }, { status: 500 })
  }
}
