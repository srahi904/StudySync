// src/app/api/materials/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? 10)))

    if (q.trim().length < 2) {
      return NextResponse.json({ success: true, data: { results: [], count: 0, query: q } })
    }

    const results = await prisma.material.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { subject: { contains: q, mode: 'insensitive' } },
              { tags: { hasSome: [q.toLowerCase()] } },
            ]
          },
          {
            OR: [
              { visibility: 'PUBLIC' },
              { userId: session.user.id },
              { sharedWith: { some: { sharedWithUserId: session.user.id } } }
            ]
          }
        ]
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, image: true } }
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: { results, count: results.length, query: q }
    })
  } catch (err) {
    console.error('[GET /api/materials/search]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
