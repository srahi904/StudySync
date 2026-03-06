// src/app/api/upload/cover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

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
      return NextResponse.json({ success: false, message: 'File too large. Max 10MB.' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()

    // Compress + resize to 1200x400 landscape, output as WebP
    const compressed = await sharp(Buffer.from(bytes))
      .resize(1200, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer()

    const b64 = compressed.toString('base64');
    const dataURI = `data:image/webp;base64,${b64}`;

    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'studysync/covers',
      public_id: `${session.user.id}_${Date.now()}`,
      resource_type: 'image',
    });

    const coverUrl = uploadResponse.secure_url;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverPhoto: coverUrl },
    })

    return NextResponse.json({
      success: true,
      message: 'Cover photo uploaded successfully',
      data: { url: coverUrl, size: compressed.length },
    })
  } catch (error) {
    console.error('[UPLOAD_COVER]', error)
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 })
  }
}
