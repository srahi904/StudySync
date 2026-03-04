// src/app/api/groups/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkGroupPermissions } from '@/lib/groups/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId } = await params
    const userId = session.user.id

    // Must be a member to see members
    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.role) return NextResponse.json({ success: false, message: 'Not a member' }, { status: 403 })

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, university: true, major: true },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('[GROUP_MEMBERS_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch members' }, { status: 500 })
  }
}
