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

const PLACEHOLDER_ACTIVITIES = [
  { type: 'signup', text: 'Welcome to StudySync AI! Start by completing your profile.', time: 'Just now' },
  { type: 'ai', text: 'AI Assistant is ready to help with your studies.', time: '1 min ago' },
  { type: 'upload', text: 'Upload your first study material to get started.', time: 'Tip' },
  { type: 'group', text: 'Join or create a study group to collaborate.', time: 'Tip' },
  { type: 'quiz', text: 'Take your first AI-generated quiz after uploading materials.', time: 'Tip' },
]

export function ActivityFeed() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
      <div className="space-y-1">
        {PLACEHOLDER_ACTIVITIES.map((activity, i) => {
          const Icon = ACTIVITY_ICONS[activity.type] || BookOpen
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-muted-foreground" />
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
