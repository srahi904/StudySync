'use client'
// src/components/dashboard/quick-actions.tsx
import { BookOpen, Bot, Hash, Award } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const ACTIONS = [
  { label: 'Upload Material', icon: BookOpen, color: 'from-blue-500 to-blue-600', hoverShadow: 'hover:shadow-blue-500/20', href: '/materials/upload', disabled: false },
  { label: 'Start AI Chat', icon: Bot, color: 'from-purple-500 to-purple-600', hoverShadow: 'hover:shadow-purple-500/20', href: '/ai-assistant' },
  { label: 'Public Chat', icon: Hash, color: 'from-emerald-500 to-emerald-600', hoverShadow: 'hover:shadow-emerald-500/20', href: '/public-chat', disabled: false },
  { label: 'Take Quiz', icon: Award, color: 'from-orange-500 to-orange-600', hoverShadow: 'hover:shadow-orange-500/20', href: '/quizzes', disabled: true },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        const inner = (
          <>
            <div className={cn(
              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110',
              action.color
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
            {action.disabled && (
              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">Coming Soon</span>
            )}
          </>
        )

        if (!action.disabled) {
          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                'relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/60 bg-card',
                'transition-all duration-300 group overflow-hidden',
                'hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg',
                action.hoverShadow
              )}
            >
              {inner}
            </Link>
          )
        }

        return (
          <button
            key={action.label}
            disabled
            className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/40 bg-card/50 opacity-50 cursor-not-allowed transition-all"
          >
            {inner}
          </button>
        )
      })}
    </div>
  )
}
