'use client'
// src/components/materials/file-uploader.tsx
import { useCallback, useState } from 'react'
import { Upload, X, File, FileText, Image, Video, Music, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFileSize, MAX_FILE_SIZE } from '@/lib/materials/material-utils'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  onClear?: () => void
  selectedFile?: File | null
  accept?: string
  maxSize?: number
  className?: string
  disabled?: boolean
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Video
  if (mimeType.startsWith('audio/')) return Music
  return File
}

function getFileBgColor(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'from-red-500/20 to-red-600/20'
  if (mimeType.startsWith('image/')) return 'from-green-500/20 to-green-600/20'
  if (mimeType.startsWith('video/')) return 'from-purple-500/20 to-purple-600/20'
  if (mimeType.startsWith('audio/')) return 'from-pink-500/20 to-pink-600/20'
  return 'from-blue-500/20 to-blue-600/20'
}

export function FileUploader({
  onFileSelect,
  onClear,
  selectedFile,
  accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.mp3,.wav,.txt',
  maxSize = MAX_FILE_SIZE,
  className,
  disabled = false,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be under ${formatFileSize(maxSize)}`
    }
    return null
  }, [maxSize])

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [disabled, handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (selectedFile) {
    const Icon = getFileIcon(selectedFile.type)
    const bgGradient = getFileBgColor(selectedFile.type)

    return (
      <div className={cn(
        'rounded-xl border border-border bg-muted/20 p-4',
        'flex items-center gap-4',
        className
      )}>
        <div className={cn(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
          bgGradient
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
      >
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
          isDragOver ? 'bg-primary/10' : 'bg-muted'
        )}>
          {isDragOver ? (
            <FolderOpen className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="text-center">
          <p className="font-medium text-foreground">
            {isDragOver ? 'Drop file here' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, DOC, PPT, XLS, Images, Videos, Audio
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Maximum file size: {formatFileSize(maxSize)}
          </p>
        </div>
      </label>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}
