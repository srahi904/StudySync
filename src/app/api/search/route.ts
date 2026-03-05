import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: { materials: [], users: [] } })
    }

    // Search for public/owned/shared materials matching the query
    const materialsPromise = prisma.material.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
        AND: [
          {
            OR: [
              { visibility: 'PUBLIC' },
              { userId: session.user.id },
              { sharedWith: { some: { sharedWithUserId: session.user.id } } },
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        subject: true,
        type: true,
      },
      take: 5,
    })

    // Search for users matching the query
    const usersPromise = prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { university: { contains: query, mode: 'insensitive' } },
          { major: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        university: true,
        major: true,
        image: true,
      },
      take: 5,
    })

    const [materials, users] = await Promise.all([materialsPromise, usersPromise])

    return NextResponse.json(
      {
        success: true,
        data: { materials, users }
      },
      {
        headers: { 'Cache-Control': 'private, max-age=60' }
      }
    )
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
