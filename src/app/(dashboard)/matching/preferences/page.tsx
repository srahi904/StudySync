'use client'

import { PreferencesForm } from '@/components/matching/preferences-form'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'

export default function MatchingPreferencesPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Matching Preferences
          </h1>
          <p className="text-sm text-muted-foreground">Tell us what you're looking for in a study partner</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <PreferencesForm onSaved={() => router.push('/matching')} />
      </div>
    </div>
  )
}
