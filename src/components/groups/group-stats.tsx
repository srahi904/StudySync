// src/components/groups/group-stats.tsx
import { Users, BookOpen, Activity } from 'lucide-react'

interface GroupStatsProps {
  memberCount: number
  maxMembers: number
  materialCount: number
  className?: string
}

export function GroupStats({ memberCount, maxMembers, materialCount, className = '' }: GroupStatsProps) {
  return (
    <div className={`flex items-center gap-3 text-sm text-muted-foreground ${className}`}>
      <span className="flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        {memberCount}/{maxMembers}
      </span>
      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
      <span className="flex items-center gap-1">
        <BookOpen className="h-3.5 w-3.5" />
        {materialCount} materials
      </span>
    </div>
  )
}
