import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Auto-delete notifications older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    })

    const notifications = await prisma.notification.findMany({
      where: { 
        userId: session.user.id,
        type: { not: 'MESSAGE' }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: { name: true, image: true, avatar: true },
        },
      },
    })

    const unreadCount = notifications.filter((n: any) => !n.read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false, type: { not: 'MESSAGE' } },
      data: { read: true },
    })
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    await prisma.notification.deleteMany({
      where: { userId: session.user.id, type: { not: 'MESSAGE' } },
    })
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
