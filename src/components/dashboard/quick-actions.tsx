'use client'
// src/components/dashboard/quick-actions.tsx
import { BookOpen, Bot, Users, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { label: 'Upload Material', icon: BookOpen, color: 'from-blue-500 to-blue-600', disabled: true },
  { label: 'Start AI Chat', icon: Bot, color: 'from-purple-500 to-purple-600', disabled: true },
  { label: 'Create Group', icon: Users, color: 'from-emerald-500 to-emerald-600', disabled: true },
  { label: 'Take Quiz', icon: Award, color: 'from-orange-500 to-orange-600', disabled: true },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.label}
            disabled={action.disabled}
            className={cn(
              'relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card',
              'transition-all duration-300 group overflow-hidden',
              action.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5'
            )}
          >
            <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', action.color)}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
            {action.disabled && (
              <span className="text-[10px] text-muted-foreground/60">Coming Soon</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
