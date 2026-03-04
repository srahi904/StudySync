// src/app/api/groups/[id]/materials/[materialId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkGroupPermissions } from '@/lib/groups/permissions'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    const { id: groupId, materialId } = await params
    const userId = session.user.id

    const shared = await prisma.groupMaterial.findUnique({
      where: { groupId_materialId: { groupId, materialId } },
    })
    if (!shared) return NextResponse.json({ success: false, message: 'Shared material not found' }, { status: 404 })

    const perms = await checkGroupPermissions(groupId, userId)
    // Only the sharer or an admin can unshare
    const isSharer = shared.sharedBy === userId
    if (!isSharer && !perms.canManageMembers) {
      return NextResponse.json({ success: false, message: 'Not authorized to unshare this material' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupMaterial.delete({ where: { groupId_materialId: { groupId, materialId } } })
      await tx.studyGroup.update({ where: { id: groupId }, data: { materialCount: { decrement: 1 } } })
    })

    return NextResponse.json({ success: true, message: 'Material unshared' })
  } catch (error) {
    console.error('[MATERIAL_UNSHARE_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Failed to unshare material' }, { status: 500 })
  }
}
