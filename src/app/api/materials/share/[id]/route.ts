import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const material = await prisma.material.findUnique({ where: { id } })
    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (material.userId !== session.user.id && session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (material.visibility !== 'PRIVATE') {
      return NextResponse.json({ error: 'Only private materials can be shared' }, { status: 400 })
    }

    const { userId, canDownload = true, canEdit = false, expiresAt } = await req.json()

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    const share = await prisma.materialShare.upsert({
      where: {
        materialId_sharedWithUserId: {
          materialId: id,
          sharedWithUserId: userId
        }
      },
      update: {
        canDownload,
        canEdit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      create: {
        materialId: id,
        sharedWithUserId: userId,
        sharedByUserId: session.user.id,
        canDownload,
        canEdit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        sharedWithUser: { select: { id: true, name: true, email: true, avatar: true, image: true } }
      }
    })

    return NextResponse.json({ success: true, data: { share } })
  } catch (err) {
    console.error('[POST /api/materials/share/[id]]', err)
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
    if (material.userId !== session.user.id && session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    await prisma.materialShare.delete({
      where: {
        materialId_sharedWithUserId: {
          materialId: id,
          sharedWithUserId: userId
        }
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Access removed successfully' })
  } catch (err) {
    console.error('[DELETE /api/materials/share/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        sharedWith: {
          include: {
            sharedWithUser: { select: { id: true, name: true, email: true, avatar: true, image: true } },
            sharedBy: { select: { id: true, name: true, email: true, avatar: true, image: true } }
          }
        }
      }
    })

    if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (material.userId !== session.user.id && session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ success: true, data: { shares: material.sharedWith } })
  } catch (err) {
    console.error('[GET /api/materials/share/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
