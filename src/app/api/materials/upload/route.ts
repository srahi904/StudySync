// src/app/api/materials/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'
import { isMimeTypeSupported, MAX_FILE_SIZE } from '@/lib/materials/material-utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // Validate file type
    if (!isMimeTypeSupported(file.type)) {
      return NextResponse.json({ error: `File type "${file.type}" is not supported` }, { status: 400 })
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using a Promise stream
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'studysync_materials',
          // Use 'auto' resource_type so Cloudinary handles PDFs, videos, images correctly
          resource_type: 'auto',
          // Optional: You can assign a public_id if you want predictability
          // public_id: `${session.user.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: uploadResult.secure_url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }
    })
  } catch (err) {
    console.error('[POST /api/materials/upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
