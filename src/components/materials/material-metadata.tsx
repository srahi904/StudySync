'use client'
// src/components/materials/material-metadata.tsx
import { MaterialType, MaterialStatus } from '@/lib/materials/types'
import { BookOpen, FileText, HardDrive, Tag, Globe, Lock, Calendar, Hash } from 'lucide-react'
import { TypeBadge } from './type-badge'
import { StatusBadge } from './status-badge'
import { formatFileSize, getMaterialTypeLabel } from '@/lib/materials/material-utils'
import { cn } from '@/lib/utils'

interface MaterialMetadataProps {
  title: string
  description?: string | null
  subject?: string | null
  tags: string[]
  type: MaterialType
  status: MaterialStatus
  fileSize: number
  fileName: string
  mimeType: string
  isPublic: boolean
  createdAt: Date | string
  updatedAt: Date | string
  className?: string
}

interface MetaRowProps {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}

function MetaRow({ icon: Icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  )
}

export function MaterialMetadata({
  subject, tags, type, status, fileSize, fileName,
  mimeType, isPublic, createdAt, updatedAt, className
}: MaterialMetadataProps) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">File Details</h3>

      <div className="divide-y divide-border/50">
        <MetaRow icon={FileText} label="File Type">
          <TypeBadge type={type} />
        </MetaRow>

        <MetaRow icon={BookOpen} label="Status">
          <StatusBadge status={status} />
        </MetaRow>

        {subject && (
          <MetaRow icon={BookOpen} label="Subject">
            <span className="text-foreground">{subject}</span>
          </MetaRow>
        )}

        <MetaRow icon={HardDrive} label="File Size">
          <span>{formatFileSize(fileSize)}</span>
        </MetaRow>

        <MetaRow icon={FileText} label="File Name">
          <span className="truncate block">{fileName}</span>
        </MetaRow>

        <MetaRow icon={isPublic ? Globe : Lock} label="Visibility">
          <span className="flex items-center gap-1.5">
            {isPublic ? (
              <><Globe className="w-3.5 h-3.5 text-blue-500" /> Public</>
            ) : (
              <><Lock className="w-3.5 h-3.5 text-muted-foreground" /> Private</>
            )}
          </span>
        </MetaRow>

        <MetaRow icon={Calendar} label="Uploaded">
          <span>{new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </MetaRow>

        {new Date(updatedAt).getTime() !== new Date(createdAt).getTime() && (
          <MetaRow icon={Calendar} label="Last Updated">
            <span>{new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </MetaRow>
        )}

        {tags.length > 0 && (
          <MetaRow icon={Tag} label="Tags">
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-normal">
                  #{tag}
                </span>
              ))}
            </div>
          </MetaRow>
        )}
      </div>
    </div>
  )
}
