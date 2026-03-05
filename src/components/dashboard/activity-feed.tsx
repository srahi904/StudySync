// src/components/dashboard/activity-feed.tsx
import { BookOpen, Award, Users, Bot, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, any> = {
  upload: BookOpen,
  quiz: Award,
  group: Users,
  ai: Bot,
  signup: UserPlus,
}

const ACTIVITY_COLORS: Record<string, string> = {
  upload: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
  quiz: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
  group: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
  ai: 'bg-purple-500/10 text-purple-500 dark:text-purple-400',
  signup: 'bg-primary/10 text-primary',
}

const PLACEHOLDER_ACTIVITIES = [
  { type: 'signup', text: 'Welcome to StudySync AI! Start by completing your profile.', time: 'Just now' },
  { type: 'ai', text: 'AI Assistant is ready to help with your studies.', time: '1 min ago' },
  { type: 'upload', text: 'Upload your first study material to get started.', time: 'Tip' },
  { type: 'group', text: 'Join or create a study group to collaborate.', time: 'Tip' },
  { type: 'quiz', text: 'Take your first AI-generated quiz after uploading materials.', time: 'Tip' },
]

export function ActivityFeed() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
        Recent Activity
      </h3>
      <div className="space-y-1">
        {PLACEHOLDER_ACTIVITIES.map((activity, i) => {
          const Icon = ACTIVITY_ICONS[activity.type] || BookOpen
          const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-muted text-muted-foreground'
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">{activity.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
