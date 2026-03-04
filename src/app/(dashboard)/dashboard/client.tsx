'use client'
// src/app/(dashboard)/dashboard/client.tsx
import { Clock, BookOpen, Award, Flame } from 'lucide-react'
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

  // Fetch live dashboard stats
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

    // Background AI Profile Match Check (delayed so it doesn't block load)
    const matchTimer = setTimeout(() => {
      fetch('/api/ai/match', { method: 'POST' }).catch(() => {})
    }, 5000)

    return () => clearTimeout(matchTimer)
  }, [])

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-extrabold">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your learning overview</p>
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
            <Link href="/materials" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentMaterials.map((m: any) => (
              <Link
                key={m.id}
                href={`/materials/${m.id}`}
                className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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

      {/* Activity Feed */}
      <ActivityFeed />

      {/* Trending Materials */}
      <TrendingMaterials />
    </div>
  )
}
