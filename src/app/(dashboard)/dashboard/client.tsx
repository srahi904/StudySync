'use client'
// src/app/(dashboard)/dashboard/client.tsx
import { Clock, BookOpen, Award, Flame, ArrowRight, Heart, Users, Sparkles } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import dynamic from 'next/dynamic'

const ActivityFeed = dynamic(() => import('@/components/dashboard/activity-feed').then(m => m.ActivityFeed))
const TrendingMaterials = dynamic(() => import('@/components/dashboard/trending-materials').then(m => m.TrendingMaterials))
import { useEffect, useState } from 'react'
import Link from 'next/link'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface DashboardClientProps {
  user: { name?: string | null; email?: string | null; id?: string }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const firstName = user.name?.split(' ')[0] || 'there'
  const [materialsCount, setMaterialsCount] = useState<{ total: number; thisWeek: number } | null>(null)
  const [recentMaterials, setRecentMaterials] = useState<any[]>([])
  const [matchCount, setMatchCount] = useState<number | null>(null)

  useEffect(() => {
    // Materials count
    fetch('/api/materials/count')
      .then(r => r.json())
      .then(d => { if (d.success) setMaterialsCount(d.data) })
      .catch(() => {})

    // Recent materials (last 3)
    fetch('/api/materials?page=1&limit=3&sortBy=date&sortOrder=desc')
      .then(r => r.json())
      .then(d => { if (d.success) setRecentMaterials(d.data.materials) })
      .catch(() => {})

    // Match count
    fetch('/api/matching/matches')
      .then(r => r.json())
      .then(d => { if (d.matches) setMatchCount(d.matches.length) })
      .catch(() => setMatchCount(0))

    // Background AI Profile Match Check (delayed so it doesn't block load)
    const matchTimer = setTimeout(() => {
      fetch('/api/ai/match', { method: 'POST' }).catch(() => {})
    }, 5000)

    return () => clearTimeout(matchTimer)
  }, [])

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here&apos;s your learning overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          icon={Clock}
          title="Study Time"
          value="0h"
          subtitle="This week"
          trend="+0h"
          trendUp={true}
          color="blue"
        />
        <StatsCard
          icon={BookOpen}
          title="Materials"
          value={materialsCount ? materialsCount.total.toString() : '—'}
          subtitle="Total uploaded"
          trend={materialsCount ? `+${materialsCount.thisWeek} this week` : undefined}
          trendUp={true}
          color="purple"
          href="/materials"
        />
        <StatsCard
          icon={Award}
          title="Avg Score"
          value="—"
          subtitle="No quizzes yet"
          color="green"
        />
        <StatsCard
          icon={Flame}
          title="Streak"
          value="1 day"
          subtitle="Keep it going!"
          trend="New!"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* Smart Matching CTA — Week 8 */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 p-5 sm:p-6">
        <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full bg-secondary/8 blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              Smart Matching
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">NEW</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {matchCount !== null && matchCount > 0
                ? `You have ${matchCount} study partner${matchCount > 1 ? 's' : ''}! Find more compatible matches.`
                : 'Find AI-matched study partners based on your subjects, goals, and learning style.'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/matching"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" /> Find Matches
            </Link>
            {matchCount !== null && matchCount > 0 && (
              <Link
                href="/matching/matches"
                className="px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium hover:bg-muted/30 transition-all flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> My Matches
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Recent Materials Widget */}
      {recentMaterials.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recently Uploaded</h2>
            <Link href="/materials" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentMaterials.map((m: any) => (
              <Link
                key={m.id}
                href={`/materials/${m.slug || m.id}`}
                className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{m.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.subject || m.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed + Trending side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <TrendingMaterials />
      </div>
    </div>
  )
}
