// GET /api/matching/find — Find compatible matches
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateCompatibility } from '@/lib/matching/algorithm'
import { generateAIMatchReasons } from '@/lib/matching/ai-analysis'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get current user with preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, subjects: true, studyGoals: true,
        lastActiveAt: true, avatar: true, image: true,
        preferences: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get blocked/skipped user IDs
    const actions = await prisma.matchAction.findMany({
      where: {
        userId,
        OR: [
          { action: 'BLOCK' },
          { action: 'SKIP', expiresAt: { gt: new Date() } },
        ],
      },
      select: { targetUserId: true },
    })
    const excludeIds = new Set(actions.map(a => a.targetUserId))
    excludeIds.add(userId)

    // Get already-matched user IDs (pending or accepted)
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId, status: { in: ['PENDING', 'ACCEPTED'] } },
          { user2Id: userId, status: { in: ['PENDING', 'ACCEPTED'] } },
        ],
      },
      select: { user1Id: true, user2Id: true },
    })
    for (const m of existingMatches) {
      excludeIds.add(m.user1Id === userId ? m.user2Id : m.user1Id)
    }

    // Find candidate users (active users with matching enabled)
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        isActive: true,
        matchingEnabled: true,
      },
      select: {
        id: true, name: true, username: true, subjects: true,
        studyGoals: true, lastActiveAt: true, avatar: true,
        image: true, bio: true, university: true, major: true,
        preferences: true,
      },
      take: 50,
      orderBy: { lastActiveAt: 'desc' },
    })

    // Score each candidate
    const scored = candidates.map(candidate => {
      const score = calculateCompatibility(
        {
          id: currentUser.id,
          subjects: currentUser.subjects,
          studyGoals: currentUser.studyGoals,
          lastActiveAt: currentUser.lastActiveAt,
          preferences: currentUser.preferences ? {
            subjects: currentUser.preferences.subjects,
            interests: currentUser.preferences.interests,
            learningProgress: currentUser.preferences.learningProgress as Record<string, string> | null,
            studyTimes: currentUser.preferences.studyTimes,
            goals: currentUser.preferences.goals,
            learningStyle: currentUser.preferences.learningStyle,
            availableDays: currentUser.preferences.availableDays,
            lookingFor: currentUser.preferences.lookingFor,
          } : null,
        },
        {
          id: candidate.id,
          subjects: candidate.subjects,
          studyGoals: candidate.studyGoals,
          lastActiveAt: candidate.lastActiveAt,
          preferences: candidate.preferences ? {
            subjects: candidate.preferences.subjects,
            interests: candidate.preferences.interests,
            learningProgress: candidate.preferences.learningProgress as Record<string, string> | null,
            studyTimes: candidate.preferences.studyTimes,
            goals: candidate.preferences.goals,
            learningStyle: candidate.preferences.learningStyle,
            availableDays: candidate.preferences.availableDays,
            lookingFor: candidate.preferences.lookingFor,
          } : null,
        }
      )

      return { candidate, score }
    })
      .filter(s => s.score.total >= 20) // Min threshold
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 10)

    // Format response
    const matches = scored.map(({ candidate, score }) => ({
      id: candidate.id,
      name: candidate.name,
      username: candidate.username,
      avatar: candidate.avatar || candidate.image,
      bio: candidate.bio,
      university: candidate.university,
      major: candidate.major,
      subjects: candidate.subjects,
      compatibility: score,
    }))

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('[MATCHING_FIND]', error)
    return NextResponse.json({ error: 'Failed to find matches' }, { status: 500 })
  }
}
