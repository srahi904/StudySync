'use client'

import { getInitials } from '@/lib/utils'
import { GraduationCap, BookOpen } from 'lucide-react'

interface SwipeCardProps {
  user: {
    id: string
    name: string
    username?: string | null
    avatar?: string | null
    bio?: string | null
    university?: string | null
    major?: string | null
    subjects: string[]
    compatibility: {
      total: number
      matchedSubjects: string[]
      reasons: string[]
      breakdown: {
        subjects: number
        learningProgress: number
        studyTime: number
        goals: number
        skillLevel: number
        learningStyle: number
        activityBonus: number
      }
    }
  }
}

export function SwipeCard({ user }: SwipeCardProps) {
  const avatarUrl = user.avatar

  return (
    <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
      {/* Header gradient */}
      <div className="h-32 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{getInitials(user.name)}</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 pb-6 px-6 text-center space-y-4">
        <div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          {user.username && (
            <p className="text-sm text-primary font-medium">@{user.username}</p>
          )}
          {user.university && (
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {user.university}
              {user.major && ` · ${user.major}`}
            </p>
          )}
        </div>

        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
        )}

        {/* Compatibility score */}
        <div className="flex items-center justify-center gap-2">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
              <circle
                cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                stroke="url(#scoreGradient)"
                strokeDasharray={`${(user.compatibility.total / 100) * 175.9} 175.9`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {user.compatibility.total}%
            </span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match</span>
        </div>

        {/* Common subjects */}
        {user.compatibility.matchedSubjects.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Common Subjects
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {user.compatibility.matchedSubjects.slice(0, 4).map(sub => (
                <span key={sub} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Match reasons */}
        {user.compatibility.reasons.length > 0 && (
          <div className="text-left space-y-1 pt-2 border-t border-border">
            {user.compatibility.reasons.slice(0, 2).map((reason, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                {reason}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
