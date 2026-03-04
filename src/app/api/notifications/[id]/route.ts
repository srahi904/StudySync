import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return new NextResponse('Not found', { status: 404 })
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    })

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
