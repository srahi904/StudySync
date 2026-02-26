// src/components/dashboard/stats-card.tsx
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle: string
  trend?: string
  trendUp?: boolean
  color: 'blue' | 'purple' | 'green' | 'orange'
}

const colorMap = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', ring: 'ring-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', ring: 'ring-purple-500/20' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/20' },
}

export function StatsCard({ icon: Icon, title, value, subtitle, trend, trendUp, color }: StatsCardProps) {
  const c = colorMap[color]

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-border/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-1', c.bg, c.ring)}>
          <Icon className={cn('w-5 h-5', c.text)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5 group-hover:gradient-text transition-all">{value}</p>
      <p className="text-xs text-muted-foreground">{title} · {subtitle}</p>
    </div>
  )
}
