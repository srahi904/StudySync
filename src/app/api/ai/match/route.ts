import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createNotification } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

// Calculates simple Jaccard similarity based on subjects and tags
function calculateMatchScore(userItems: string[], targetItems: string[]): number {
  if (userItems.length === 0 || targetItems.length === 0) return 0
  
  const userSet = new Set(userItems.map(i => i.toLowerCase()))
  const targetSet = new Set(targetItems.map(i => i.toLowerCase()))
  
  const intersection = new Set([...userSet].filter(x => targetSet.has(x)))
  const union = new Set([...userSet, ...targetSet])
  
  return (intersection.size / union.size) // 1.0 = 100% Match
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // 1. Fetch current user data (tags/subjects)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subjects: true, studyGoals: true }
    })

    if (!user || (!user.subjects?.length && !user.studyGoals?.length)) {
      return NextResponse.json({ success: true, message: 'User profile lacks details to match against.' })
    }

    const userKeywords = [...(user.subjects || []), ...(user.studyGoals || [])]

    // 2. We don't want to suggest users/groups we've already suggested recently
    // Check if a suggestion was made in the last 7 days
    const recentSuggestions = await prisma.notification.findFirst({
      where: {
        userId,
        type: { in: ['SUGGEST_USER', 'SUGGEST_GROUP'] as any as NotificationType[] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })

    if (recentSuggestions) {
      return NextResponse.json({ success: true, message: 'Already suggested recently.' })
    }

    let matchFound = false

    // 3. Find potentially matching Users (>85% match)
    const allUsers = await prisma.user.findMany({
      where: { id: { not: userId }, isActive: true },
      select: { id: true, name: true, subjects: true, studyGoals: true },
      take: 100 // limit to recent/active users ideally
    })

    for (const targetUser of allUsers) {
      const targetKeywords = [...(targetUser.subjects || []), ...(targetUser.studyGoals || [])]
      const score = calculateMatchScore(userKeywords, targetKeywords)
      
      if (score >= 0.85) { // ~90% match threshold
        // Check if already following
        const follows = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: targetUser.id } }
        })
        
        if (!follows) {
          await createNotification({
            userId,
            actorId: targetUser.id,
            type: 'SUGGEST_USER' as NotificationType,
            content: `We found a ~${Math.round(score * 100)}% profile match! Connect with ${targetUser.name}`,
            link: `/profile/${targetUser.id}`
          })
          matchFound = true
          break // Send one suggestion at a time
        }
      }
    }

    // 4. Find potentially matching Groups (>85% match) over 100 groups
    if (!matchFound) {
      const groupsToSuggest = await prisma.studyGroup.findMany({
        where: { privacy: { in: ['PUBLIC', 'INVITE_ONLY'] }, isArchived: false },
        select: { id: true, name: true, subject: true, tags: true },
        take: 100
      })

      for (const targetGroup of groupsToSuggest) {
        const groupKeywords = [targetGroup.subject, ...(targetGroup.tags || [])].filter(Boolean) as string[]
        const score = calculateMatchScore(userKeywords, groupKeywords)
        
        if (score >= 0.85) {
          // Check if already a member or pending join
          const member = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: targetGroup.id, userId } }
          })
          
          if (!member) {
            await createNotification({
              userId,
              type: 'SUGGEST_GROUP' as NotificationType,
              content: `A group "${targetGroup.name}" matches ~${Math.round(score * 100)}% of your interests. Join now!`,
              link: `/groups/${targetGroup.id}`
            })
            matchFound = true
            break
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: matchFound ? 'Match suggested.' : 'No matches over 85% found.' })
  } catch (error) {
    console.error('Match AI error:', error)
    return NextResponse.json({ success: false, message: 'Matching process failed' }, { status: 500 })
  }
}
