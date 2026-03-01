'use client'
// src/components/materials/status-badge.tsx
import { MaterialStatus } from '@prisma/client'
import { cn } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/materials/material-utils'
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

const STATUS_ICONS: Record<MaterialStatus, React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  PROCESSING: Loader2,
  FAILED: AlertCircle,
}

interface StatusBadgeProps {
  status: MaterialStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const Icon = STATUS_ICONS[status]
  const colorClass = getStatusColor(status)
  const label = getStatusLabel(status)

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
      colorClass,
      className
    )}>
      {showIcon && (
        <Icon className={cn('w-3 h-3', status === 'PROCESSING' && 'animate-spin')} />
      )}
      {label}
    </span>
  )
}
