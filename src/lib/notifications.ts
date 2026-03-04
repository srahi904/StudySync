import { prisma } from '@/lib/db'
import { triggerPusherEvent } from '@/lib/pusher/server'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string        // Recipient
  actorId?: string      // The person who triggered it
  type: NotificationType
  content: string       // Text to display
  link?: string         // URL to navigate to when clicked
}

export async function createNotification({
  userId,
  actorId,
  type,
  content,
  link,
}: CreateNotificationParams) {
  // Don't notify users about their own actions
  if (userId === actorId) return null

  try {
    // Write to the DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        content,
        link,
      },
      include: {
        actor: { select: { id: true, name: true, avatar: true, image: true } }
      } // Fetch actor details for the real-time UI
    })

    // Broadcast in real-time
    await triggerPusherEvent(
      CHANNELS.user(userId),
      EVENTS.NEW_NOTIFICATION,
      { notification }
    ).catch(e => console.error('[PUSHER NOTIFICATION ERROR]', e))

    return notification
  } catch (error) {
    console.error('[CREATE NOTIFICATION ERROR]', error)
    return null
  }
}
