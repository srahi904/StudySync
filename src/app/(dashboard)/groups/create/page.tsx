// src/app/(dashboard)/groups/create/page.tsx
import { CreateGroupForm } from '@/components/groups/create-group-form'

export default function CreateGroupPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create a Study Group</h1>
        <p className="text-muted-foreground mt-1">Set up your group and start collaborating</p>
      </div>
      <CreateGroupForm />
    </div>
  )
}
