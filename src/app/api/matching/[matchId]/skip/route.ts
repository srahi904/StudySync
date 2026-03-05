// POST /api/matching/[matchId]/skip — Skip user for 30 days
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

    await prisma.matchAction.upsert({
      where: {
        userId_targetUserId_action: { userId, targetUserId, action: 'SKIP' },
      },
      update: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId,
        targetUserId,
        action: 'SKIP',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MATCH_SKIP]', error)
    return NextResponse.json({ error: 'Failed to skip user' }, { status: 500 })
  }
}
