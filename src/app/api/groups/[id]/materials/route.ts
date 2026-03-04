// src/app/api/groups/[id]/materials/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkGroupPermissions } from '@/lib/groups/permissions'
import { notifyGroupMembers } from '@/lib/groups/notifications'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

// GET: List group materials
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId } = await params
    const userId = session.user.id

    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.role) return NextResponse.json({ success: false, message: 'Not a member' }, { status: 403 })

    const materials = await prisma.groupMaterial.findMany({
      where: { groupId },
      include: {
        material: {
          select: {
            id: true, title: true, description: true, type: true,
            fileUrl: true, fileSize: true, mimeType: true, subject: true,
            tags: true, createdAt: true,
          },
        },
        sharer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { sharedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: materials })
  } catch (error) {
    console.error('[GROUP_MATERIALS_GET_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch materials' }, { status: 500 })
  }
}

// POST: Share a material to group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId } = await params
    const userId = session.user.id

    const perms = await checkGroupPermissions(groupId, userId)
    if (!perms.role || !perms.canShareMaterials) return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 })

    const body = await req.json()
    const materialId = body.materialId as string
    if (!materialId) return NextResponse.json({ success: false, message: 'materialId is required' }, { status: 400 })

    // Ensure the material exists and belongs to user or is accessible
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true, title: true, userId: true },
    })
    if (!material) return NextResponse.json({ success: false, message: 'Material not found' }, { status: 404 })

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId }, select: { name: true } })

    const shared = await prisma.$transaction(async (tx) => {
      const gm = await tx.groupMaterial.create({
        data: { groupId, materialId, sharedBy: userId },
      })
      await tx.studyGroup.update({ where: { id: groupId }, data: { materialCount: { increment: 1 } } })
      return gm
    })

    // Notify members
    await notifyGroupMembers({
      groupId,
      groupName: group?.name ?? '',
      actorId: userId,
      type: 'SYSTEM',
      content: `New material shared in "${group?.name}": ${material.title}`,
      link: `/groups/${groupId}?tab=materials`,
    })

    await triggerPusherEvent(CHANNELS.group(groupId), EVENTS.GROUP_MATERIAL_SHARED, {
      groupId,
      materialId,
      title: material.title,
      sharedBy: userId,
    })

    return NextResponse.json({ success: true, data: shared }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ success: false, message: 'Material already shared' }, { status: 409 })
    console.error('[GROUP_MATERIALS_POST_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to share material' }, { status: 500 })
  }
}
