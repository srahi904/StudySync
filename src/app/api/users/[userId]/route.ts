// src/app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteContext = { params: Promise<{ userId: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, avatar: true, coverPhoto: true, image: true,
        bio: true, university: true, major: true, graduationYear: true,
        currentYear: true, location: true,
        linkedinUrl: true, githubUrl: true, twitterUrl: true, websiteUrl: true,
        subjects: true, studyGoals: true,
        createdAt: true, lastActiveAt: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[GET_USER_BY_ID]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
