// src/app/api/materials/count/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [total, thisWeek] = await Promise.all([
      prisma.material.count({ where: { userId: session.user.id } }),
      prisma.material.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneWeekAgo }
        }
      })
    ])

    return NextResponse.json({ success: true, data: { total, thisWeek } })
  } catch (err) {
    console.error('[GET /api/materials/count]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
