import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const skip = (page - 1) * limit

    const shares = await prisma.materialShare.findMany({
      where: {
        sharedWithUserId: session.user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        material: {
          include: {
            user: { select: { id: true, name: true, avatar: true, image: true } }
          }
        },
        sharedBy: { select: { id: true, name: true, avatar: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.materialShare.count({
      where: {
        sharedWithUserId: session.user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        shares,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        }
      }
    })
  } catch (err) {
    console.error('[GET /api/materials/shared-with-me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
