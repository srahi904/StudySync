// src/app/api/upload/cover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers')
    await mkdir(uploadDir, { recursive: true })

    const filename = `${session.user.id}_${Date.now()}.webp`
    const bytes = await file.arrayBuffer()

    // Compress + resize to 1200x400 landscape, output as WebP
    const compressed = await sharp(Buffer.from(bytes))
      .resize(1200, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer()

    await writeFile(path.join(uploadDir, filename), compressed)

    const coverUrl = `/uploads/covers/${filename}`

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
