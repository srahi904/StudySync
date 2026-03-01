// src/lib/materials/material-utils.ts
// Helper functions for material system

import { MaterialType, MaterialStatus } from '@prisma/client'

export const SUPPORTED_TYPES = {
  'application/pdf': MaterialType.PDF,
  'application/msword': MaterialType.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': MaterialType.DOCUMENT,
  'application/vnd.ms-powerpoint': MaterialType.PRESENTATION,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': MaterialType.PRESENTATION,
  'application/vnd.ms-excel': MaterialType.SPREADSHEET,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': MaterialType.SPREADSHEET,
  'image/jpeg': MaterialType.IMAGE,
  'image/png': MaterialType.IMAGE,
  'image/gif': MaterialType.IMAGE,
  'image/webp': MaterialType.IMAGE,
  'image/svg+xml': MaterialType.IMAGE,
  'video/mp4': MaterialType.VIDEO,
  'video/quicktime': MaterialType.VIDEO,
  'video/webm': MaterialType.VIDEO,
  'audio/mpeg': MaterialType.AUDIO,
  'audio/wav': MaterialType.AUDIO,
  'audio/ogg': MaterialType.AUDIO,
  'text/plain': MaterialType.TEXT,
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes

export function getMaterialTypeFromMime(mimeType: string): MaterialType {
  return SUPPORTED_TYPES[mimeType as keyof typeof SUPPORTED_TYPES] ?? MaterialType.OTHER
}

export function isMimeTypeSupported(mimeType: string): boolean {
  return mimeType in SUPPORTED_TYPES
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getMaterialTypeLabel(type: MaterialType): string {
  const labels: Record<MaterialType, string> = {
    PDF: 'PDF',
    DOCUMENT: 'Document',
    PRESENTATION: 'Presentation',
    SPREADSHEET: 'Spreadsheet',
    IMAGE: 'Image',
    VIDEO: 'Video',
    AUDIO: 'Audio',
    TEXT: 'Text',
    OTHER: 'Other',
  }
  return labels[type] ?? 'Unknown'
}

export function getMaterialTypeColor(type: MaterialType): string {
  const colors: Record<MaterialType, string> = {
    PDF: 'bg-red-500/10 text-red-500 border-red-500/20',
    DOCUMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PRESENTATION: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    SPREADSHEET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    IMAGE: 'bg-green-500/10 text-green-500 border-green-500/20',
    VIDEO: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    AUDIO: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    TEXT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    OTHER: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }
  return colors[type] ?? colors.OTHER
}

export function getStatusColor(status: MaterialStatus): string {
  const colors: Record<MaterialStatus, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-500',
    APPROVED: 'bg-emerald-500/10 text-emerald-500',
    REJECTED: 'bg-red-500/10 text-red-500',
    PROCESSING: 'bg-blue-500/10 text-blue-500',
    FAILED: 'bg-red-900/10 text-red-400',
  }
  return colors[status] ?? colors.PENDING
}

export function getStatusLabel(status: MaterialStatus): string {
  const labels: Record<MaterialStatus, string> = {
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PROCESSING: 'Processing',
    FAILED: 'Failed',
  }
  return labels[status] ?? status
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'text/plain': 'txt',
  }
  return map[mimeType] ?? 'file'
}

/** Predefined subject list for autocomplete */
export const PREDEFINED_SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'Database Systems',
  'Networking',
  'Cybersecurity',
  'Economics',
  'Business Administration',
  'Psychology',
  'English Literature',
  'History',
  'Philosophy',
  'Law',
  'Medicine',
  'Architecture',
  'Design',
  'Other',
]

export function timeAgo(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return `${months}mo ago`
}
