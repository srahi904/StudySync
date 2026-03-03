// src/app/api/materials/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getMaterialTypeFromMime } from '@/lib/materials/material-utils'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional().nullable(),
  subject: z.string().optional(),
  tags: z.array(z.string()).max(10).default([]),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'GROUP_ONLY']).default('PRIVATE'),
  fileUrl: z.string().min(1),        // relative path e.g. /uploads/materials/...
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(50 * 1024 * 1024),
  mimeType: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
    const skip = (page - 1) * limit
    const type = searchParams.get('type') || undefined
    const subject = searchParams.get('subject') || undefined
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const visibilityParam = searchParams.get('visibility')
    const userId = searchParams.get('userId') || undefined
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const tagsParam = searchParams.get('tags')
    const tagsFilter = tagsParam ? tagsParam.split(',').filter(Boolean) : []

    // Determine which materials are visible
    const visibilityFilter = userId === session.user.id
      ? { userId: session.user.id } // own materials only
      : visibilityParam === 'PUBLIC'
        ? { visibility: 'PUBLIC' }
        : { OR: [
            { visibility: 'PUBLIC' }, 
            { userId: session.user.id },
            { sharedWith: { some: { sharedWithUserId: session.user.id } } }
          ] }

    const where: any = {
      ...visibilityFilter,
      ...(type && { type: type as any }),
      ...(subject && { subject: { contains: subject, mode: 'insensitive' } }),
      ...(status && { status: status as any }),
      ...(tagsFilter.length > 0 && { tags: { hasSome: tagsFilter } }),
      ...(search && search.length >= 2 && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ]
      }),
    }

    const orderByMap: Record<string, any> = {
      date: { createdAt: sortOrder },
      title: { title: sortOrder },
      views: { viewCount: 'desc' },
      downloads: { downloadCount: 'desc' },
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, image: true }
          }
        },
        orderBy: orderByMap[sortBy] ?? { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        materials,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + limit < total,
        }
      }
    })
  } catch (err) {
    console.error('[GET /api/materials]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 })
    }

    // Resolve the real DB user - JWT token.id should match, but fallback to email lookup
    let userId = session.user.id
    const userById = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!userById) {
      // JWT sub may not match DB (e.g. DB was reset). Try email lookup or create user.
      if (session.user.email) {
        const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (userByEmail) {
          userId = userByEmail.id
        } else {
          // Self-heal: create user from session data so uploads can proceed
          console.warn('[POST /api/materials] User missing from DB, creating from session:', session.user.email)
          const newUser = await prisma.user.create({
            data: {
              id: session.user.id,
              name: session.user.name ?? 'User',
              email: session.user.email,
              emailVerified: new Date(),
            },
            select: { id: true }
          })
          userId = newUser.id
        }
      } else {
        return NextResponse.json({ error: 'Session invalid. Please sign out and sign in again.' }, { status: 401 })
      }
    }

    const { title, description, subject, tags, visibility, fileUrl, fileName, fileSize, mimeType } = parsed.data
    const type = getMaterialTypeFromMime(mimeType)

    const material = await prisma.material.create({
      data: {
        title,
        description: description ?? null,
        subject: subject || null,
        tags,
        visibility: visibility as 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY',
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        type,
        userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, image: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Material uploaded successfully!',
      data: material,
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/materials]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
