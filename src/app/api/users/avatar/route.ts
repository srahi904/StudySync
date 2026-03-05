// src/app/api/users/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

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

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'studysync_avatars',
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
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
      url: uploadResult.secure_url
    })
  } catch (err) {
    console.error('[POST /api/users/avatar]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
