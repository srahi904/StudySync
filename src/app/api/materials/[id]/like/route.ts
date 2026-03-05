import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { resolveMaterialId } from '@/lib/resolvers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const materialId = await resolveMaterialId(id);
    if (!materialId) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const userId = session.user.id;

    // Verify material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true, userId: true, visibility: true }
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Find or create the associated Post for this material
    let post = await prisma.post.findFirst({
      where: { materialId }
    });

    if (!post) {
      post = await prisma.post.create({
        data: {
          authorId: material.userId,
          materialId,
          caption: 'Material upload', // Auto-generated
        }
      });
    }

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId,
        }
      }
    });

    let newCount = post.likesCount;
    let hasLiked = false;

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: post.id },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      newCount = Math.max(0, post.likesCount - 1);
      hasLiked = false;
    } else {
      // Like
      await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId: post.id,
            userId,
          },
        }),
        prisma.post.update({
          where: { id: post.id },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      newCount = post.likesCount + 1;
      hasLiked = true;

      // TODO: Create a notification if userId !== post.authorId
    }

    // Trigger Pusher event for real-time UI updates
    await triggerPusherEvent(
      CHANNELS.material(materialId),
      EVENTS.MATERIAL_LIKES_UPDATED,
      {
        materialId,
        likesCount: newCount,
        hasLiked,
      }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        likesCount: newCount,
        hasLiked,
      }
    });
  } catch (error) {
    console.error('[POST /api/materials/[id]/like]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
