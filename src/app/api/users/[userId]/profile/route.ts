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

    const identifier = await params.then(p => p.userId);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { username: identifier }],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        image: true,
        coverPhoto: true,
        usernameUpdatedAt: true,
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

    const isOwnProfile = user.id === session.user.id;

    // Check follow status
    let followStatus = { following: false, followedBy: false, mutual: false };
    if (!isOwnProfile) {
      const [follow1, follow2] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: user.id, followingId: session.user.id } },
        }),
      ]);
      followStatus = {
        following: !!follow1,
        followedBy: !!follow2,
        mutual: !!follow1 && !!follow2,
      };
    }

    // Get materials based on visibility
    const materialsWhere: Record<string, unknown> = { userId: user.id };
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

    return NextResponse.json(
      {
        user,
        followStatus,
        isOwnProfile,
        materials,
        totalMaterials,
      },
      {
        headers: { 'Cache-Control': 'private, max-age=30' }
      }
    );
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

// PATCH: Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const identifier = await params.then(p => p.userId);

    // Resolve the identifier to the actual DB ID
    const targetUser = await prisma.user.findFirst({
      where: { OR: [{ id: identifier }, { username: identifier }] },
      select: { id: true, username: true, usernameUpdatedAt: true }
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const targetUserId = targetUser.id;

    if (!session?.user?.id || session.user.id !== targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // 1. Basic field updates
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.avatar) updateData.avatar = body.avatar;
    if (body.coverPhoto) updateData.coverPhoto = body.coverPhoto;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.university !== undefined) updateData.university = body.university;
    if (body.major !== undefined) updateData.major = body.major;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.subjects) updateData.subjects = body.subjects;
    if (body.studyGoals) updateData.studyGoals = body.studyGoals;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;

    // 2. Handle Username Update with Restrictions
    if (body.username) {
      const newUsername = body.username.toLowerCase().trim();
      
      // Validation (fallback if frontend fails)
      if (newUsername.length < 5 || !/^[a-z0-9_]+$/.test(newUsername)) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
      }

      const currentUser = targetUser; // We already fetched this

      if (currentUser?.username !== newUsername) {
        // Enforce 30-day rule
        if (currentUser?.username && currentUser.usernameUpdatedAt) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (currentUser.usernameUpdatedAt > thirtyDaysAgo) {
            const nextUpdate = new Date(currentUser.usernameUpdatedAt);
            nextUpdate.setDate(nextUpdate.getDate() + 30);
            return NextResponse.json({ 
              error: `Username can only be changed once every 30 days. Next available: ${nextUpdate.toLocaleDateString()}` 
            }, { status: 429 });
          }
        }

        // Check uniqueness
        const existing = await prisma.user.findUnique({
          where: { username: newUsername }
        });
        
        if (existing) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }

        updateData.username = newUsername;
        updateData.usernameUpdatedAt = new Date();
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
