'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { SwipeCard } from './swipe-card'
import { Check, X, Ban, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MatchCandidate {
  id: string
  name: string
  username?: string | null
  avatar?: string | null
  bio?: string | null
  university?: string | null
  major?: string | null
  subjects: string[]
  compatibility: {
    total: number
    matchedSubjects: string[]
    reasons: string[]
    breakdown: Record<string, number>
  }
}

interface SwipeStackProps {
  candidates: MatchCandidate[]
  onMatchAccepted?: (userId: string) => void
  onEmpty?: () => void
}

export function SwipeStack({ candidates: initialCandidates, onMatchAccepted, onEmpty }: SwipeStackProps) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [acting, setActing] = useState(false)
  const [showMatch, setShowMatch] = useState<MatchCandidate | null>(null)
  const { toast } = useToast()

  const currentCandidate = candidates[0]

  const handleAction = async (action: 'accept' | 'skip' | 'reject', userId: string) => {
    setActing(true)
    try {
      const urls: Record<string, string> = {
        accept: `/api/matching/${userId}/accept`,
        skip: `/api/matching/${userId}/skip`,
        reject: `/api/matching/${userId}/reject`,
      }

      const res = await fetch(urls[action], { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (action === 'accept') {
        setShowMatch(currentCandidate)
        onMatchAccepted?.(userId)
      }

      setCandidates(prev => prev.filter(c => c.id !== userId))

      if (candidates.length <= 1) {
        onEmpty?.()
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setActing(false)
    }
  }

  const handleBlock = async (userId: string) => {
    setActing(true)
    try {
      const res = await fetch('/api/matching/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      })
      if (!res.ok) throw new Error('Failed to block')

      setCandidates(prev => prev.filter(c => c.id !== userId))
      toast({ title: 'User blocked', description: 'You won\'t see them again.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setActing(false)
    }
  }

  if (!currentCandidate && !showMatch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="text-xl font-bold">No More Matches</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          We've shown you all compatible partners for now. Check back later for new suggestions!
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Match Reveal Overlay */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMatch(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 max-w-sm mx-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                className="text-5xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: 2, duration: 0.6 }}
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold gradient-text">It's a Match!</h2>
              <p className="text-sm text-muted-foreground">
                You and <strong>{showMatch.name}</strong> want to study together!
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowMatch(null)
                    window.location.href = '/chat'
                  }}
                  className="flex-1 rounded-xl"
                >
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowMatch(null)}
                  className="flex-1 rounded-xl"
                >
                  Keep Swiping
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Stack */}
      <div className="relative min-h-[520px]">
        <AnimatePresence mode="popLayout">
          {currentCandidate && (
            <motion.div
              key={currentCandidate.id}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 300, rotate: 15 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <SwipeCard user={currentCandidate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      {currentCandidate && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => handleAction('skip', currentCandidate.id)}
            disabled={acting}
            className="w-14 h-14 rounded-full bg-muted/50 hover:bg-red-500/20 border border-border hover:border-red-500/40 flex items-center justify-center transition-all group"
            title="Skip"
          >
            <X className="w-6 h-6 text-muted-foreground group-hover:text-red-500 transition-colors" />
          </button>

          <button
            onClick={() => handleBlock(currentCandidate.id)}
            disabled={acting}
            className="w-10 h-10 rounded-full bg-muted/30 hover:bg-orange-500/20 border border-border hover:border-orange-500/40 flex items-center justify-center transition-all group"
            title="Block"
          >
            <Ban className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
          </button>

          <button
            onClick={() => handleAction('accept', currentCandidate.id)}
            disabled={acting}
            className="w-16 h-16 rounded-full bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary flex items-center justify-center transition-all group shadow-lg shadow-primary/10"
            title="Accept"
          >
            {acting ? (
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            ) : (
              <Check className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      )}

      {/* Progress */}
      {candidates.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          {initialCandidates.length - candidates.length + 1} / {initialCandidates.length} candidates
        </p>
      )}
    </div>
  )
}
