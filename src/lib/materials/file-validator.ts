// src/lib/materials/file-validator.ts
// Centralized file validation - used by both API route and client uploader

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Presentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  // Text
  'text/plain',
  'text/markdown',
])

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFile(file: { size: number; type: string; name: string }): ValidationResult {
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = Math.round(file.size / 1024 / 1024)
    return { valid: false, error: `File is too large (${mb} MB). Maximum size is 50 MB.` }
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type "${file.type || 'unknown'}" is not supported.` }
  }
  return { valid: true }
}

export function validateFileSize(bytes: number): ValidationResult {
  if (bytes > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 50 MB limit' }
  }
  return { valid: true }
}

export function validateMimeType(mime: string): ValidationResult {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { valid: false, error: `Unsupported file type: ${mime}` }
  }
  return { valid: true }
}

export function isMimeAllowed(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime)
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}
