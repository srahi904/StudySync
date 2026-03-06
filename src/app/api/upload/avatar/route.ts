// src/app/api/upload/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large. Max 5MB.' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()

    // Compress + resize to 400x400 square, output as WebP
    const compressed = await sharp(Buffer.from(bytes))
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer()

    const b64 = compressed.toString('base64');
    const dataURI = `data:image/webp;base64,${b64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'studysync/avatars',
      public_id: `${session.user.id}_${Date.now()}`,
      resource_type: 'image',
    });

    const avatarUrl = uploadResponse.secure_url;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { url: avatarUrl, size: compressed.length },
    })
  } catch (error) {
    console.error('[UPLOAD_AVATAR]', error)
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 })
  }
}
