// GET/POST /api/matching/preferences
import { NextRequest, NextResponse } from 'next/server'
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

    const cacheKey = `user:${session.user.id}:prefs`

    const result = await cache.get(
      cacheKey,
      async () => {
        const prefs = await prisma.userPreferences.findUnique({
          where: { userId: session.user.id },
        })

        if (!prefs) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { subjects: true, studyGoals: true },
          })
          return {
            preferences: {
              subjects: user?.subjects || [],
              interests: [],
              learningProgress: {},
              studyTimes: [],
              goals: user?.studyGoals || [],
              learningStyle: 'VISUAL',
              studyFrequency: null,
              availableDays: [],
              hoursPerWeek: null,
              lookingFor: [],
            },
            isNew: true,
          }
        }

        return { preferences: prefs, isNew: false }
      },
      60 // 1 min cache
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[MATCHING_PREFS_GET]', error)
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        subjects: body.subjects || [],
        interests: body.interests || [],
        learningProgress: body.learningProgress || {},
        studyTimes: body.studyTimes || [],
        goals: body.goals || [],
        learningStyle: body.learningStyle || 'VISUAL',
        studyFrequency: body.studyFrequency || null,
        availableDays: body.availableDays || [],
        hoursPerWeek: body.hoursPerWeek || null,
        lookingFor: body.lookingFor || [],
      },
      create: {
        userId: session.user.id,
        subjects: body.subjects || [],
        interests: body.interests || [],
        learningProgress: body.learningProgress || {},
        studyTimes: body.studyTimes || [],
        goals: body.goals || [],
        learningStyle: body.learningStyle || 'VISUAL',
        studyFrequency: body.studyFrequency || null,
        availableDays: body.availableDays || [],
        hoursPerWeek: body.hoursPerWeek || null,
        lookingFor: body.lookingFor || [],
      },
    })

    // Invalidate cache
    await cache.del(`user:${session.user.id}:prefs`)

    return NextResponse.json({ success: true, preferences: prefs })
  } catch (error) {
    console.error('[MATCHING_PREFS_POST]', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
