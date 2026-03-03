import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        sharedWith: {
          where: { sharedWithUserId: session.user.id }
        }
      }
    })

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 })
    }

    const isOwner = material.userId === session.user.id
    const isPublic = material.visibility === 'PUBLIC'
    const isShared = material.sharedWith.length > 0
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')

    const hasAccess = isOwner || isPublic || isShared || isAdmin

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Access denied', hasAccess: false }, { status: 403 })
    }

    const share = material.sharedWith[0]

    return NextResponse.json({
      success: true,
      hasAccess: true,
      data: {
        canView: true,
        canDownload: share?.canDownload ?? true,
        canEdit: share?.canEdit ?? isOwner,
        isOwner,
        visibility: material.visibility
      }
    })
  } catch (err) {
    console.error('[GET /api/materials/check-access/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
