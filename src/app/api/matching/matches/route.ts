// GET /api/matching/matches — List accepted matches
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const cacheKey = `user:${userId}:matches`

    const formatted = await cache.get(
      cacheKey,
      async () => {
        const matches = await prisma.match.findMany({
          where: {
            status: 'ACCEPTED',
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
          include: {
            user1: {
              select: {
                id: true, name: true, username: true, avatar: true,
                image: true, bio: true, subjects: true, university: true,
              },
            },
            user2: {
              select: {
                id: true, name: true, username: true, avatar: true,
                image: true, bio: true, subjects: true, university: true,
              },
            },
          },
          orderBy: { respondedAt: 'desc' },
        })

        return matches.map(match => {
          const otherUser = match.user1Id === userId ? match.user2 : match.user1
          return {
            id: match.id,
            user: otherUser,
            score: Math.round(match.score * 100),
            matchedSubjects: match.matchedSubjects,
            matchReason: match.matchReason,
            chatConversationId: match.chatConversationId,
            matchedAt: match.respondedAt || match.createdAt,
          }
        })
      },
      120 // 2 min cache
    )

    return NextResponse.json({ matches: formatted })
  } catch (error) {
    console.error('[MATCHING_MATCHES]', error)
    return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 })
  }
}
