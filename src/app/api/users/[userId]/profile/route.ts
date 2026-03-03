// src/app/api/users/[userId]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Full user profile with follow status and materials
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        image: true,
        coverPhoto: true,
        bio: true,
        university: true,
        major: true,
        currentYear: true,
        location: true,
        subjects: true,
        studyGoals: true,
        followersCount: true,
        followingCount: true,
        linkedinUrl: true,
        githubUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        createdAt: true,
        lastActiveAt: true,
        isOnline: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwnProfile = userId === session.user.id;

    // Check follow status
    let followStatus = { following: false, followedBy: false, mutual: false };
    if (!isOwnProfile) {
      const [follow1, follow2] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: session.user.id } },
        }),
      ]);
      followStatus = {
        following: !!follow1,
        followedBy: !!follow2,
        mutual: !!follow1 && !!follow2,
      };
    }

    // Get materials based on visibility
    const materialsWhere: Record<string, unknown> = { userId };
    if (!isOwnProfile) {
      if (followStatus.following) {
        // Followers can see all materials (Public, Private, Group Only)
        // No visibility restriction applied
      } else {
        // Non-followers can only see Public materials
        materialsWhere.visibility = 'PUBLIC';
      }
    }

    const materials = await prisma.material.findMany({
      where: materialsWhere,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        subject: true,
        visibility: true,
        viewCount: true,
        downloadCount: true,
        createdAt: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
      },
    });

    // Count total materials
    const totalMaterials = await prisma.material.count({ where: materialsWhere });

    return NextResponse.json({
      user,
      followStatus,
      isOwnProfile,
      materials,
      totalMaterials,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
