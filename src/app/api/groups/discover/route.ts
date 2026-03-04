// src/app/api/groups/discover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { GroupPrivacy } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const { searchParams } = req.nextUrl
    const subject = searchParams.get('subject') || ''
    const search = searchParams.get('search') || ''
    const cursor = searchParams.get('cursor') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const cacheKey = `discover:${userId}:${subject}:${search}:${cursor}`

    const groups = await cache.get(
      cacheKey,
      async () => {
        // Get user's current group IDs to show join status
        const myMemberships = await prisma.groupMember.findMany({
          where: { userId },
          select: { groupId: true, role: true },
        })
        const myGroupMap = new Map(myMemberships.map(m => [m.groupId, m.role]))

        const myRequests = await prisma.groupJoinRequest.findMany({
          where: { userId, status: 'PENDING' },
          select: { groupId: true },
        })
        const myRequestsSet = new Set(myRequests.map(r => r.groupId))

        const found = await prisma.studyGroup.findMany({
          where: {
            privacy: { in: [GroupPrivacy.PUBLIC, GroupPrivacy.PRIVATE] },
            isArchived: false, 
            ...(subject && { subject }),
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
              ],
            }),
            ...(cursor && { id: { lt: cursor } }),
          },
          select: {
            id: true,
            name: true,
            description: true,
            subject: true,
            tags: true,
            privacy: true,
            memberCount: true,
            materialCount: true,
            maxMembers: true,
            avatar: true,
            createdAt: true,
            creator: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { memberCount: 'desc' },
          take: limit,
        })

        return found.map(g => ({
          ...g,
          myRole: myGroupMap.get(g.id) ?? null,
          isMember: myGroupMap.has(g.id),
          hasPendingRequest: myRequestsSet.has(g.id),
        }))
      },
      300 // 5 min cache
    )

    return NextResponse.json({
      success: true,
      data: groups,
      nextCursor: groups.length === limit ? (groups as any)[groups.length - 1]?.id : null,
    })
  } catch (error) {
    console.error('[GROUPS_DISCOVER_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to discover groups' }, { status: 500 })
  }
}
