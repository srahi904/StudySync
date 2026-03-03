// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UpdateProfileSchema } from '@/lib/validations'

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, image: true, avatar: true, coverPhoto: true,
        role: true, bio: true, university: true, major: true, graduationYear: true,
        currentYear: true, location: true, phoneNumber: true, dateOfBirth: true, gender: true,
        linkedinUrl: true, githubUrl: true, twitterUrl: true, websiteUrl: true,
        subjects: true, studyGoals: true, preferredStudyTime: true,
        profileCompleted: true, onboarded: true, emailVerified: true,
        createdAt: true, lastActiveAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[GET_USER_ME]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

// PATCH update current user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = UpdateProfileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = result.data

    // Clean empty strings to null for optional URL fields
    const cleanData: any = { ...data }
    const urlFields = ['linkedinUrl', 'githubUrl', 'twitterUrl', 'websiteUrl']
    for (const field of urlFields) {
      if (cleanData[field] === '') cleanData[field] = null
    }
    const optionalStrings = ['bio', 'university', 'major', 'currentYear', 'location', 'phoneNumber', 'preferredStudyTime']
    for (const field of optionalStrings) {
      if (cleanData[field] === '') cleanData[field] = null
    }

    // Set profileCompleted if key fields are filled
    if (data.name && (data.university || data.major)) {
      cleanData.profileCompleted = true
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: cleanData,
      select: {
        id: true, name: true, email: true, avatar: true, coverPhoto: true,
        bio: true, university: true, major: true, graduationYear: true,
        currentYear: true, location: true, phoneNumber: true, gender: true,
        linkedinUrl: true, githubUrl: true, twitterUrl: true, websiteUrl: true,
        subjects: true, studyGoals: true, preferredStudyTime: true,
        profileCompleted: true,
      },
    })

    return NextResponse.json({ success: true, message: 'Profile updated successfully', data: user })
  } catch (error) {
    console.error('[UPDATE_USER_ME]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
