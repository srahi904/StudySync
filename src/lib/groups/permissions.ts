// src/lib/groups/permissions.ts
import { prisma } from '@/lib/db'
import { cache } from '@/lib/redis'
import { GroupRole } from '@prisma/client'

export interface GroupPermissions {
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canManageMembers: boolean
  canShareMaterials: boolean
  canApproveRequests: boolean
  role: GroupRole | null
}

export const NO_PERMISSIONS: GroupPermissions = {
  canEdit: false,
  canDelete: false,
  canInvite: false,
  canManageMembers: false,
  canShareMaterials: false,
  canApproveRequests: false,
  role: null,
}

export async function checkGroupPermissions(
  groupId: string,
  userId: string
): Promise<GroupPermissions> {
  const cacheKey = `perms:${groupId}:${userId}`

  return cache.get<GroupPermissions>(
    cacheKey,
    async () => {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
        select: { role: true },
      })

      if (!member) return NO_PERMISSIONS

      const isOwner = member.role === GroupRole.OWNER
      const isAdmin = member.role === GroupRole.ADMIN
      const isPrivileged = isOwner || isAdmin

      return {
        role: member.role,
        canEdit: isPrivileged,
        canDelete: isOwner,
        canInvite: true, // all members can invite (unless group settings restrict)
        canManageMembers: isPrivileged,
        canShareMaterials: true, // all members can share
        canApproveRequests: isPrivileged,
      }
    },
    600 // 10-minute cache
  )
}

/** Call this when a member's role changes or they leave/are removed */
export async function invalidateGroupPermissions(groupId: string, userId: string) {
  const { cache: cacheHelper } = await import('@/lib/redis')
  await cacheHelper.del(`perms:${groupId}:${userId}`)
}
