// src/app/(dashboard)/profile/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  redirect(`/profile/${(session.user as any).username || session.user.id}`)
}
