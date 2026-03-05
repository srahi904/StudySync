// src/app/api/groups/[id]/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveGroupId } from '@/lib/resolvers'
import { checkGroupPermissions } from '@/lib/groups/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: paramId } = await params
    const groupId = await resolveGroupId(paramId)
    if (!groupId) return NextResponse.json({ success: false, message: 'Group not found' }, { status: 404 })

    const userId = session.user.id

    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.canApproveRequests) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 })

    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, avatar: true, university: true, major: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: requests })
  } catch (error) {
    console.error('[GROUP_REQUESTS_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch requests' }, { status: 500 })
  }
}
