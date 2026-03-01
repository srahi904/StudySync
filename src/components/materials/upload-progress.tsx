'use client'
// src/components/materials/upload-progress.tsx
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadProgressProps {
  progress: number
  status: 'uploading' | 'success' | 'error'
  fileName?: string
  errorMessage?: string
}

export function UploadProgress({ progress, status, fileName, errorMessage }: UploadProgressProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3',
      status === 'error' ? 'border-red-500/30 bg-red-500/5' :
      status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' :
      'border-border bg-muted/30'
    )}>
      {fileName && (
        <p className="text-sm font-medium truncate">{fileName}</p>
      )}

      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading...
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'success' && (
        <p className="text-sm text-emerald-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          Upload complete!
        </p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <XCircle className="w-4 h-4" />
          {errorMessage || 'Upload failed. Please try again.'}
        </p>
      )}
    </div>
  )
}
