// src/components/dashboard/stats-card.tsx
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string
  subtitle: string
  trend?: string
  trendUp?: boolean
  color: 'blue' | 'purple' | 'green' | 'orange'
  href?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500 dark:text-blue-400',
    ring: 'ring-blue-500/20',
    shadow: 'hover:shadow-[0_8px_32px_hsl(220_80%_55%/0.15)]',
    glow: 'group-hover:bg-blue-500/15',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500 dark:text-purple-400',
    ring: 'ring-purple-500/20',
    shadow: 'hover:shadow-[0_8px_32px_hsl(270_80%_55%/0.15)]',
    glow: 'group-hover:bg-purple-500/15',
  },
  green: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    shadow: 'hover:shadow-[0_8px_32px_hsl(160_60%_45%/0.15)]',
    glow: 'group-hover:bg-emerald-500/15',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500 dark:text-orange-400',
    ring: 'ring-orange-500/20',
    shadow: 'hover:shadow-[0_8px_32px_hsl(30_80%_55%/0.15)]',
    glow: 'group-hover:bg-orange-500/15',
  },
}

export function StatsCard({ icon: Icon, title, value, subtitle, trend, trendUp, color, href }: StatsCardProps) {
  const c = colorMap[color]

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-1 transition-colors', c.bg, c.ring, c.glow)}>
          <Icon className={cn('w-5 h-5', c.text)} />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            trendUp ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5 group-hover:gradient-text transition-all">{value}</p>
      <p className="text-xs text-muted-foreground">{title} · {subtitle}</p>
    </>
  )

  const classes = cn(
    "bg-card border border-border/60 rounded-2xl p-5 transition-all duration-300 group",
    "hover:-translate-y-1 hover:border-border",
    c.shadow
  )

  if (href) {
    return <Link href={href} className={classes}>{content}</Link>
  }

  return <div className={classes}>{content}</div>
}
