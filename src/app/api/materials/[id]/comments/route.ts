import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { triggerPusherEvent } from '@/lib/pusher/server';
import { CHANNELS, EVENTS } from '@/lib/pusher/channels';
import { resolveMaterialId } from '@/lib/resolvers';

// GET: Fetch comments for a material
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Find the associated post
    const post = await prisma.post.findFirst({
      where: { materialId, isDeleted: false }
    });

    if (!post) {
      return NextResponse.json({ success: true, data: [] });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id, isDeleted: false, parentId: null },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, image: true }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: comments.reverse() });
  } catch (error) {
    console.error('[GET /api/materials/[id]/comments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a comment to a material
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
    
    const { content } = await req.json();
    const userId = session.user.id;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Verify material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true, userId: true }
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Find or create the associated Post
    let post = await prisma.post.findFirst({
      where: { materialId }
    });

    if (!post) {
      post = await prisma.post.create({
        data: {
          authorId: material.userId,
          materialId,
        }
      });
    }

    // Write comment
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId: post!.id,
          authorId: userId,
          content: content.trim(),
        },
        include: {
          author: { select: { id: true, name: true, avatar: true, image: true } }
        }
      });

      await tx.post.update({
        where: { id: post!.id },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    // Trigger real-time event
    await triggerPusherEvent(
      CHANNELS.material(materialId),
      EVENTS.NEW_MATERIAL_COMMENT,
      comment
    ).catch(() => {});

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/materials/[id]/comments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
