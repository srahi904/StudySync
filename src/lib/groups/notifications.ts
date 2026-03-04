// src/lib/groups/notifications.ts
import { prisma } from '@/lib/db'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { NotificationType } from '@prisma/client'

interface NotifyGroupParams {
  groupId: string
  groupName: string
  actorId: string
  type: NotificationType
  content: string
  link: string
  excludeUserId?: string
}

/** Notify all group members via DB notifications + Pusher */
export async function notifyGroupMembers({
  groupId,
  groupName: _groupName,
  actorId,
  type,
  content,
  link,
  excludeUserId,
}: NotifyGroupParams) {
  // Get all member IDs (exclude the actor and optionally another user)
  const members = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: {
        notIn: [actorId, ...(excludeUserId ? [excludeUserId] : [])],
      },
    },
    select: { userId: true },
  })

  if (members.length === 0) return

  // Create DB notifications in bulk
  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      actorId,
      type,
      content,
      link,
    })),
    skipDuplicates: true,
  })

  // Push to each user's personal Pusher channel
  for (const member of members) {
    try {
      await triggerPusherEvent(CHANNELS.user(member.userId), EVENTS.NEW_NOTIFICATION, {
        type,
        content,
        link,
        actorId,
      })
    } catch {
      // Non-critical
    }
  }
}

/** Notify admins only (e.g., join request) */
export async function notifyGroupAdmins({
  groupId,
  actorId,
  type,
  content,
  link,
}: Omit<NotifyGroupParams, 'groupName' | 'excludeUserId'>) {
  const admins = await prisma.groupMember.findMany({
    where: {
      groupId,
      role: { in: ['OWNER', 'ADMIN'] },
      userId: { not: actorId },
    },
    select: { userId: true },
  })

  if (admins.length === 0) return

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.userId,
      actorId,
      type,
      content,
      link,
    })),
    skipDuplicates: true,
  })

  for (const admin of admins) {
    try {
      await triggerPusherEvent(CHANNELS.user(admin.userId), EVENTS.NEW_NOTIFICATION, {
        type,
        content,
        link,
        actorId,
      })
    } catch {
      // Non-critical
    }
  }
}
