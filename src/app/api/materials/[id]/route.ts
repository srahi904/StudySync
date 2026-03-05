// src/app/api/materials/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Enable ISR at the route level

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  subject: z.string().min(1).optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'GROUP_ONLY']).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cache the material query for 60 seconds (unique to the requesting user due to sharedWith relation)
    const material = await cache.get(
      `material:${id}:user:${session.user.id}`,
      () => prisma.material.findUnique({
        where: { id },
        include: { 
          user: { select: { id: true, username: true, name: true, avatar: true, image: true, university: true } },
          sharedWith: { where: { sharedWithUserId: session.user.id } }
        }
      }),
      60
    )

    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check access
    const isOwner = material.userId === session.user.id
    const isPublic = material.visibility === 'PUBLIC'
    const isSharedWithUser = material.sharedWith.length > 0
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')

    if (!isPublic && !isOwner && !isSharedWithUser && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check follow status
    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: material.userId,
        }
      }
    })

    // Fetch associated post (or return null if none exists yet)
    const post = await prisma.post.findFirst({
      where: { materialId: material.id, isDeleted: false },
      include: {
        likes: { where: { userId: session.user.id }, select: { id: true } },
      }
    })

    // Format response payload
    const payload = {
      ...material,
      isFollowing: !!isFollowing,
      post: post ? {
        id: post.id,
        likesCount: post.likesCount,
        commentCount: post.commentCount,
        hasLiked: post.likes.length > 0,
      } : null,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('[GET /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const material = await prisma.material.findUnique({ where: { id } })
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (material.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
    }

    const updated = await prisma.material.update({
      where: { id },
      data: parsed.data,
      include: { user: { select: { id: true, name: true, avatar: true, image: true } } }
    })

    return NextResponse.json({ success: true, message: 'Material updated', data: updated })
  } catch (err) {
    console.error('[PATCH /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const material = await prisma.material.findUnique({ where: { id } })
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (material.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.material.delete({ where: { id } })

    // Invalidate dashboard count cache
    await cache.del(`user:${session.user.id}:materials:count`)

    return NextResponse.json({ success: true, message: 'Material deleted successfully' })
  } catch (err) {
    console.error('[DELETE /api/materials/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
