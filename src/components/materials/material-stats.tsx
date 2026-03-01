'use client'
// src/components/materials/material-stats.tsx
import { Eye, Download, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MaterialStatsProps {
  viewCount: number
  downloadCount: number
  createdAt: Date | string
  className?: string
  variant?: 'inline' | 'cards'
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card gap-1', color)}>
      <Icon className="w-5 h-5 text-muted-foreground" />
      <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function MaterialStats({ viewCount, downloadCount, createdAt, className, variant = 'inline' }: MaterialStatsProps) {
  const date = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const ratio = viewCount > 0 ? Math.round((downloadCount / viewCount) * 100) : 0

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
        <StatCard icon={Eye} label="Total Views" value={viewCount} color="" />
        <StatCard icon={Download} label="Downloads" value={downloadCount} color="" />
        <StatCard icon={TrendingUp} label="DL Rate" value={`${ratio}%`} color="" />
        <StatCard icon={Calendar} label="Uploaded" value={new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} color="" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-xs text-muted-foreground', className)}>
      <span className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5" />
        <strong className="text-foreground">{viewCount.toLocaleString()}</strong> views
      </span>
      <span className="flex items-center gap-1.5">
        <Download className="w-3.5 h-3.5" />
        <strong className="text-foreground">{downloadCount.toLocaleString()}</strong> downloads
      </span>
      {viewCount > 0 && (
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <strong className="text-foreground">{ratio}%</strong> download rate
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {date}
      </span>
    </div>
  )
}
