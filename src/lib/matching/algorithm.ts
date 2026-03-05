// src/lib/matching/algorithm.ts
// Core compatibility scoring engine for smart matching

export interface CompatibilityScore {
  total: number       // 0-100
  breakdown: {
    subjects: number         // max 40
    learningProgress: number // max 25
    studyTime: number        // max 15
    goals: number            // max 10
    skillLevel: number       // max 5
    learningStyle: number    // max 5
    activityBonus: number    // max 10
  }
  matchedSubjects: string[]
  reasons: string[]
}

interface UserForMatching {
  id: string
  subjects: string[]
  studyGoals: string[]
  lastActiveAt: Date | string
  preferences?: {
    subjects: string[]
    interests: string[]
    learningProgress: Record<string, string> | null
    studyTimes: string[]
    goals: string[]
    learningStyle: string
    availableDays: string[]
    lookingFor: string[]
  } | null
}

function intersection(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(s => s.toLowerCase()))
  return a.filter(item => setB.has(item.toLowerCase()))
}

/** Calculate learning progress compatibility (25 pts) */
function calculateProgressMatch(
  progress1: Record<string, string> | null | undefined,
  progress2: Record<string, string> | null | undefined
): number {
  if (!progress1 || !progress2) return 0

  const stages: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  }

  const commonSubjects = intersection(
    Object.keys(progress1),
    Object.keys(progress2)
  )

  if (commonSubjects.length === 0) return 0

  let totalScore = 0

  for (const subject of commonSubjects) {
    const level1 = stages[progress1[subject]] || 1
    const level2 = stages[progress2[subject]] || 1
    const diff = Math.abs(level1 - level2)

    if (diff === 1) totalScore += 10       // complementary levels - perfect
    else if (diff === 0) totalScore += 7   // same level - good study partners
    else if (diff === 2) totalScore += 4   // mentor-mentee
  }

  return Math.min(25, (totalScore / commonSubjects.length) * (commonSubjects.length > 1 ? 1.2 : 1))
}

/** Calculate activity bonus based on recency (up to 10 pts) */
function calculateActivityBonus(user1: UserForMatching, user2: UserForMatching): number {
  const now = Date.now()
  const last1 = new Date(user1.lastActiveAt).getTime()
  const last2 = new Date(user2.lastActiveAt).getTime()

  const hoursSince1 = (now - last1) / (1000 * 60 * 60)
  const hoursSince2 = (now - last2) / (1000 * 60 * 60)

  // Both active in last 24h = 10, last week = 5, older = 2
  const score1 = hoursSince1 < 24 ? 5 : hoursSince1 < 168 ? 3 : 1
  const score2 = hoursSince2 < 24 ? 5 : hoursSince2 < 168 ? 3 : 1

  return score1 + score2
}

/** Generate human-readable match reasons */
function generateMatchReasons(
  user1: UserForMatching,
  user2: UserForMatching,
  commonSubjects: string[]
): string[] {
  const reasons: string[] = []

  if (commonSubjects.length > 0) {
    reasons.push(`Both studying ${commonSubjects.slice(0, 3).join(', ')}`)
  }

  const p1 = user1.preferences
  const p2 = user2.preferences

  if (p1 && p2) {
    const commonTimes = intersection(p1.studyTimes, p2.studyTimes)
    if (commonTimes.length > 0) {
      reasons.push(`Both prefer studying in the ${commonTimes[0]}`)
    }

    const commonGoals = intersection(p1.goals, p2.goals)
    if (commonGoals.length > 0) {
      reasons.push(`Shared goal: ${commonGoals[0]}`)
    }

    if (p1.learningStyle === p2.learningStyle) {
      reasons.push(`Same learning style: ${p1.learningStyle.toLowerCase()}`)
    }

    // Complementary progress
    if (p1.learningProgress && p2.learningProgress) {
      for (const subject of commonSubjects) {
        const l1 = (p1.learningProgress as Record<string, string>)[subject]
        const l2 = (p2.learningProgress as Record<string, string>)[subject]
        if (l1 && l2 && l1 !== l2) {
          reasons.push(`Complementary levels in ${subject}: ${l1} + ${l2}`)
          break
        }
      }
    }
  }

  return reasons.slice(0, 4)
}

/** Main compatibility calculation */
export function calculateCompatibility(
  user1: UserForMatching,
  user2: UserForMatching
): CompatibilityScore {
  const p1 = user1.preferences
  const p2 = user2.preferences

  // Merge user.subjects with preferences.subjects for broader matching
  const subjects1 = [...new Set([...user1.subjects, ...(p1?.subjects || [])])]
  const subjects2 = [...new Set([...user2.subjects, ...(p2?.subjects || [])])]

  // 1. Subject Similarity (40 pts)
  const commonSubjects = intersection(subjects1, subjects2)
  const maxSubjects = Math.max(subjects1.length, subjects2.length, 1)
  const subjectScore = Math.round((commonSubjects.length / maxSubjects) * 40)

  // 2. Learning Progress (25 pts)
  const progressScore = Math.round(
    calculateProgressMatch(
      p1?.learningProgress as Record<string, string> | null,
      p2?.learningProgress as Record<string, string> | null
    )
  )

  // 3. Study Time Overlap (15 pts)
  const times1 = p1?.studyTimes || []
  const times2 = p2?.studyTimes || []
  const commonTimes = intersection(times1, times2)
  const maxTimes = Math.max(times1.length, times2.length, 1)
  const timeScore = Math.round((commonTimes.length / maxTimes) * 15)

  // 4. Goal Alignment (10 pts)
  const goals1 = [...new Set([...user1.studyGoals, ...(p1?.goals || [])])]
  const goals2 = [...new Set([...user2.studyGoals, ...(p2?.goals || [])])]
  const commonGoals = intersection(goals1, goals2)
  const maxGoals = Math.max(goals1.length, goals2.length, 1)
  const goalScore = Math.round((commonGoals.length / maxGoals) * 10)

  // 5. Skill Level compatibility (5 pts) — complementary is best
  let skillScore = 3 // default
  if (p1?.learningProgress && p2?.learningProgress) {
    const prog1 = p1.learningProgress as Record<string, string>
    const prog2 = p2.learningProgress as Record<string, string>
    const shared = intersection(Object.keys(prog1), Object.keys(prog2))
    if (shared.length > 0) {
      const diffs = shared.map(s => {
        const stages: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }
        return Math.abs((stages[prog1[s]] || 1) - (stages[prog2[s]] || 1))
      })
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
      skillScore = avgDiff === 1 ? 5 : avgDiff === 0 ? 4 : 2
    }
  }

  // 6. Learning Style (5 pts)
  const styleScore =
    p1 && p2 && p1.learningStyle === p2.learningStyle ? 5 :
    p1 && p2 ? 2 : 3

  // 7. Activity Bonus (up to 10 pts)
  const activityBonus = calculateActivityBonus(user1, user2)

  const total = Math.min(110, subjectScore + progressScore + timeScore + goalScore + skillScore + styleScore + activityBonus)

  return {
    total: Math.min(100, total),
    breakdown: {
      subjects: subjectScore,
      learningProgress: progressScore,
      studyTime: timeScore,
      goals: goalScore,
      skillLevel: skillScore,
      learningStyle: styleScore,
      activityBonus,
    },
    matchedSubjects: commonSubjects,
    reasons: generateMatchReasons(user1, user2, commonSubjects),
  }
}
