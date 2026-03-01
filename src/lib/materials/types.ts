// src/lib/materials/types.ts
// Local type definitions for materials - avoids Prisma client import issues in some environments

export type MaterialType = 
  | 'PDF'
  | 'DOCUMENT'
  | 'PRESENTATION'
  | 'SPREADSHEET'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'TEXT'
  | 'OTHER'

export type MaterialStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'FAILED'

export interface MaterialUser {
  id: string
  name: string | null
  avatar?: string | null
  image?: string | null
  university?: string | null
}

export interface Material {
  id: string
  title: string
  description: string | null
  subject: string | null
  tags: string[]
  type: MaterialType
  status: MaterialStatus
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  isPublic: boolean
  viewCount: number
  downloadCount: number
  userId: string
  createdAt: Date
  updatedAt: Date
  user?: MaterialUser
}
