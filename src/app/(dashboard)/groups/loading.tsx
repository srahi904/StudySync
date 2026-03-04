// src/app/(dashboard)/groups/loading.tsx
import { GroupGridSkeleton } from '@/components/groups/group-grid'

export default function GroupsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse mb-2" />
      <div className="h-4 w-64 rounded bg-muted animate-pulse mb-8" />
      <GroupGridSkeleton />
    </div>
  )
}
