// src/app/(dashboard)/profile/[userId]/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileView } from '@/components/profile/profile-view'

export const metadata = { title: 'Profile' }

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, avatar: true, coverPhoto: true, image: true,
      bio: true, university: true, major: true, graduationYear: true,
      currentYear: true, location: true,
      linkedinUrl: true, githubUrl: true, twitterUrl: true, websiteUrl: true,
      subjects: true, studyGoals: true, role: true,
      createdAt: true, lastActiveAt: true,
    },
  })

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground mt-2">This profile doesn&apos;t exist.</p>
      </div>
    )
  }

  const isOwn = session.user.id === user.id

  return <ProfileView user={user} isOwn={isOwn} />
}
