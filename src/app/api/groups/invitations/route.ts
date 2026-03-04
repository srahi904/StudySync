// src/app/api/groups/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { InvitationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // ISR revalidation 

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // Cache the query for 60 seconds to drastically improve load time
    const invitations = await cache.get(
      `user:${userId}:invitations`,
      () => prisma.groupInvitation.findMany({
        where: { invitedUserId: userId, status: InvitationStatus.PENDING, expiresAt: { gt: new Date() } },
        include: {
          group: { select: { id: true, name: true, subject: true, avatar: true, memberCount: true, privacy: true } },
          inviter: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      60
    )

    return NextResponse.json({ success: true, data: invitations })
  } catch (error) {
    console.error('[INVITATIONS_GET_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch invitations' }, { status: 500 })
  }
}
