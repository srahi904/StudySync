// POST /api/matching/block — Permanently block user
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId, reason } = await req.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user required' }, { status: 400 })
    }

    const userId = session.user.id

    await prisma.matchAction.upsert({
      where: {
        userId_targetUserId_action: { userId, targetUserId, action: 'BLOCK' },
      },
      update: { reason },
      create: {
        userId,
        targetUserId,
        action: 'BLOCK',
        reason,
        expiresAt: null, // permanent
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MATCH_BLOCK]', error)
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
  }
}
