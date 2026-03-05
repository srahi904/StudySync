'use client'

import { useState, useEffect } from 'react'
import { SwipeStack } from '@/components/matching/swipe-stack'
import { Loader2, Settings, Users, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MatchingPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPrefs, setHasPrefs] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Check if user has preferences
        const prefsRes = await fetch('/api/matching/preferences')
        const prefsData = await prefsRes.json()
        if (prefsData.isNew) {
          setHasPrefs(false)
          setLoading(false)
          return
        }

        // Find matches
        const res = await fetch('/api/matching/find')
        const data = await res.json()
        setCandidates(data.matches || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No preferences set yet — prompt to set them
  if (!hasPrefs) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-display">Find Your Study Partner</h1>
        <p className="text-muted-foreground">
          Set your study preferences first so we can match you with the most compatible partners.
        </p>
        <Link href="/matching/preferences">
          <Button size="lg" className="rounded-xl font-bold gap-2">
            <Settings className="w-5 h-5" /> Set My Preferences
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" /> Find Partners
          </h1>
          <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">Swipe through compatible study buddies</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link href="/matching/preferences">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Settings className="w-4 h-4" /> Preferences
            </Button>
          </Link>
          <Link href="/matching/matches">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Users className="w-4 h-4" /> Matches
            </Button>
          </Link>
        </div>
      </div>

      {/* Swipe Stack */}
      <div className="max-w-sm mx-auto sm:max-w-md pt-4">
        <SwipeStack candidates={candidates} />
      </div>
    </div>
  )
}
