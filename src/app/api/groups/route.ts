// src/app/api/groups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { CreateGroupSchema } from '@/lib/validations'
import { redis } from '@/lib/redis'

// ── GET: My groups ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const cacheKey = `user:${userId}:groups`

    const groups = await cache.get(
      cacheKey,
      async () => {
        return prisma.groupMember.findMany({
          where: { userId },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                subject: true,
                tags: true,
                privacy: true,
                memberCount: true,
                materialCount: true,
                avatar: true,
                createdAt: true,
                creator: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        })
      },
      60 // 1 min cache
    )

    return NextResponse.json({ success: true, data: groups })
  } catch (error) {
    console.error('[GROUPS_GET_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch groups' }, { status: 500 })
  }
}

// ── POST: Create group ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const body = await req.json()

    const result = CreateGroupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, description, subject, tags, privacy, maxMembers } = result.data

    // Rate limit: 5 groups per hour via Redis
    if (redis) {
      const rateKey = `ratelimit:create-group:${userId}`
      const current = await redis.incr(rateKey)
      if (current === 1) await redis.expire(rateKey, 3600)
      if (current > 5) {
        return NextResponse.json({ success: false, message: 'Too many groups created. Try again in an hour.' }, { status: 429 })
      }
    }

    // Create group + add creator as OWNER in a transaction
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.studyGroup.create({
        data: {
          name,
          description,
          subject,
          tags: tags ?? [],
          privacy,
          maxMembers,
          creatorId: userId,
          memberCount: 1,
          settings: { allowInvites: true, allowMaterialSharing: true },
        },
      })
      await tx.groupMember.create({
        data: { groupId: newGroup.id, userId, role: 'OWNER' },
      })
      return newGroup
    })

    // Invalidate the user's group list cache
    await cache.del(`user:${userId}:groups`)

    return NextResponse.json({ success: true, data: group }, { status: 201 })
  } catch (error) {
    console.error('[GROUPS_CREATE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to create group' }, { status: 500 })
  }
}
