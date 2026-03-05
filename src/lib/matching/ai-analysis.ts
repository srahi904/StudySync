// src/lib/matching/ai-analysis.ts
// Uses Gemini AI to generate personalized match reasons

import { generateText } from 'ai'
import { googleAI, AI_MODELS } from '@/lib/ai/gemini'
import type { CompatibilityScore } from './algorithm'

export async function generateAIMatchReasons(
  user1: { name: string; subjects: string[]; studyGoals: string[] },
  user2: { name: string; subjects: string[]; studyGoals: string[] },
  score: CompatibilityScore
): Promise<string[]> {
  try {
    const prompt = `You are StudySync AI. Generate exactly 3 short, encouraging reasons (each max 15 words) why these two students would be great study partners.

User 1: Subjects: ${user1.subjects.join(', ')}. Goals: ${user1.studyGoals.join(', ')}.
User 2: Subjects: ${user2.subjects.join(', ')}. Goals: ${user2.studyGoals.join(', ')}.
Common subjects: ${score.matchedSubjects.join(', ') || 'None'}.
Compatibility: ${score.total}%.

Return ONLY a JSON array of 3 strings, no markdown. Example: ["reason 1", "reason 2", "reason 3"]`

    const { text } = await generateText({
      model: googleAI(AI_MODELS.CHAT_FALLBACK),
      prompt,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3)
    }
    return score.reasons
  } catch {
    // Fallback to algorithm-generated reasons
    return score.reasons
  }
}
