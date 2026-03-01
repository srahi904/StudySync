'use client'
// src/components/materials/empty-state.tsx
import { BookOpen, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  description?: string
  showUploadButton?: boolean
  icon?: React.ElementType
}

export function EmptyState({
  title = 'No materials found',
  description = 'Upload your first study material to get started',
  showUploadButton = true,
  icon: Icon = BookOpen,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-primary/40" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {showUploadButton && (
        <Button asChild>
          <Link href="/materials/upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Material
          </Link>
        </Button>
      )}
    </div>
  )
}
