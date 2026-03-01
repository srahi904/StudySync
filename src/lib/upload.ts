// src/lib/upload.ts
// Reusable upload utility shared across materials, avatar, cover photo, etc.

export interface UploadOptions {
  endpoint: string
  file: File
  fieldName?: string
  onProgress?: (percent: number) => void
  additionalData?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

/**
 * Upload a file with XHR to get real progress events.
 * Falls back gracefully if progress is not supported.
 */
export function uploadWithProgress({
  endpoint,
  file,
  fieldName = 'file',
  onProgress,
  additionalData,
}: UploadOptions): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append(fieldName, file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, data })
        } else {
          resolve({ success: false, error: data?.error || `Upload failed (${xhr.status})` })
        }
      } catch {
        resolve({ success: false, error: 'Failed to parse upload response' })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Network error during upload' })
    })

    xhr.addEventListener('abort', () => {
      resolve({ success: false, error: 'Upload cancelled' })
    })

    xhr.open('POST', endpoint)
    xhr.send(formData)
  })
}

/**
 * Simple fetch-based upload (no progress tracking).
 */
export async function uploadFile(endpoint: string, file: File, fieldName = 'file'): Promise<UploadResult> {
  const formData = new FormData()
  formData.append(fieldName, file)

  const res = await fetch(endpoint, { method: 'POST', body: formData })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { success: false, error: data?.error || 'Upload failed' }
  }

  return { success: true, data }
}
