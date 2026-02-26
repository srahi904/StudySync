'use client'
// src/app/(dashboard)/dashboard/client.tsx
import { Clock, BookOpen, Award, Flame } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface DashboardClientProps {
  user: { name?: string | null; email?: string | null }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const firstName = user.name?.split(' ')[0] || 'there'

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
          value="0"
          subtitle="Total uploaded"
          color="purple"
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

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  )
}
