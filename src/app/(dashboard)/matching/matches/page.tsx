'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Users, MessageCircle, Heart } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface MatchedUser {
  id: string
  user: {
    id: string
    name: string
    username?: string | null
    avatar?: string | null
    image?: string | null
    bio?: string | null
    subjects: string[]
    university?: string | null
  }
  score: number
  matchedSubjects: string[]
  matchReason?: string | null
  chatConversationId?: string | null
  matchedAt: string
}

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/matching/matches')
      .then(r => r.json())
      .then(data => setMatches(data.matches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
            <Users className="w-6 h-6 text-primary" /> My Matches
          </h1>
          <p className="text-sm text-muted-foreground">{matches.length} study partners matched</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No Matches Yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start swiping to find compatible study partners!
          </p>
          <Link href="/matching">
            <Button className="rounded-xl">Find Partners</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {matches.map(match => {
            const u = match.user
            const avatarUrl = u.avatar || u.image

            return (
              <div
                key={match.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <Link href={`/profile/${u.username || u.id}`} className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">{getInitials(u.name)}</span>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.username || u.id}`} className="font-semibold hover:text-primary transition-colors">
                    {u.name}
                  </Link>
                  {u.university && (
                    <p className="text-xs text-muted-foreground">{u.university}</p>
                  )}
                  {match.matchedSubjects.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {match.matchedSubjects.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{match.score}%</span>
                  {match.chatConversationId && (
                    <Link href="/chat">
                      <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                        <MessageCircle className="w-4 h-4" /> Chat
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
