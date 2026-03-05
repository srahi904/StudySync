// src/app/api/materials/analytics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveMaterialId } from '@/lib/resolvers'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['view', 'download'])
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const resolvedId = await resolveMaterialId(params.id)
    if (!resolvedId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { action } = parsed.data

    const material = await prisma.material.update({
      where: { id: resolvedId },
      data: {
        ...(action === 'view' && { viewCount: { increment: 1 } }),
        ...(action === 'download' && { downloadCount: { increment: 1 } }),
      },
      select: { viewCount: true, downloadCount: true }
    })

    return NextResponse.json({ success: true, data: material })
  } catch (err) {
    console.error('[POST /api/materials/analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
