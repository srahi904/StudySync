'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, BookOpen, Clock, Target, Brain, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const PREDEFINED_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Geography', 'Economics', 'Psychology',
  'Data Science', 'Machine Learning', 'Web Development', 'Mobile Development',
  'React', 'Node.js', 'Python', 'Java', 'C++', 'JavaScript',
  'Statistics', 'Business', 'Marketing', 'Design', 'Philosophy',
]

const STUDY_TIMES = ['morning', 'afternoon', 'evening', 'night']
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const GOALS = [
  'Exam Preparation', 'Build Projects', 'Research', 'Homework Help',
  'Skill Development', 'Career Prep', 'Learn New Topics', 'Revision',
]
const LEARNING_STYLES = [
  { value: 'VISUAL', label: '👁️ Visual', desc: 'Diagrams, videos' },
  { value: 'AUDITORY', label: '👂 Auditory', desc: 'Podcasts, discussions' },
  { value: 'KINESTHETIC', label: '🤲 Kinesthetic', desc: 'Hands-on practice' },
  { value: 'READING_WRITING', label: '📖 Reading/Writing', desc: 'Notes, articles' },
  { value: 'MIXED', label: '🔄 Mixed', desc: 'All styles' },
]
const LOOKING_FOR = ['study-buddy', 'mentor', 'mentee', 'group', 'project-partner']

interface PreferencesFormProps {
  onSaved?: () => void
}

export function PreferencesForm({ onSaved }: PreferencesFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [subjects, setSubjects] = useState<string[]>([])
  const [studyTimes, setStudyTimes] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])
  const [learningStyle, setLearningStyle] = useState('VISUAL')
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [hoursPerWeek, setHoursPerWeek] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/matching/preferences')
      .then(r => r.json())
      .then(data => {
        const p = data.preferences
        setSubjects(p.subjects || [])
        setStudyTimes(p.studyTimes || [])
        setGoals(p.goals || [])
        setLearningStyle(p.learningStyle || 'VISUAL')
        setAvailableDays(p.availableDays || [])
        setLookingFor(p.lookingFor || [])
        setHoursPerWeek(p.hoursPerWeek || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(a => a !== item) : [...arr, item])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/matching/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects, studyTimes, goals, learningStyle,
          availableDays, lookingFor, hoursPerWeek,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: '✅ Preferences saved!' })
      onSaved?.()
    } catch {
      toast({ title: 'Error saving preferences', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Subjects */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Subjects You Study
        </Label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_SUBJECTS.map(sub => (
            <button
              key={sub}
              onClick={() => toggle(subjects, sub, setSubjects)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border font-semibold transition-all duration-200',
                subjects.includes(sub)
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40 scale-[1.05]'
                  : 'bg-muted/40 text-foreground/60 border-border/50 hover:border-emerald-400/50 hover:text-emerald-500'
              )}
            >
              {sub}
            </button>
          ))}
        </div>
      </section>

      {/* Study Times */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Preferred Study Times
        </Label>
        <div className="flex flex-wrap gap-2">
          {STUDY_TIMES.map(time => (
            <button
              key={time}
              onClick={() => toggle(studyTimes, time, setStudyTimes)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border capitalize font-semibold transition-all duration-200',
                studyTimes.includes(time)
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40 scale-[1.05]'
                  : 'bg-muted/40 text-foreground/60 border-border/50 hover:border-emerald-400/50 hover:text-emerald-500'
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Study Goals
        </Label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(goal => (
            <button
              key={goal}
              onClick={() => toggle(goals, goal, setGoals)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border font-semibold transition-all duration-200',
                goals.includes(goal)
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40 scale-[1.05]'
                  : 'bg-muted/40 text-foreground/60 border-border/50 hover:border-emerald-400/50 hover:text-emerald-500'
              )}
            >
              {goal}
            </button>
          ))}
        </div>
      </section>

      {/* Learning Style */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" /> Learning Style
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LEARNING_STYLES.map(style => (
            <button
              key={style.value}
              onClick={() => setLearningStyle(style.value)}
              className={cn(
                'text-left p-3 rounded-xl border transition-all duration-200',
                learningStyle === style.value
                  ? 'bg-emerald-500/15 border-emerald-500 text-foreground shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                  : 'bg-muted/30 border-border/50 text-foreground/60 hover:border-emerald-400/40 hover:text-foreground'
              )}
            >
              <p className="text-sm font-medium">{style.label}</p>
              <p className="text-[10px] text-muted-foreground">{style.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Available Days */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Available Days
        </Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggle(availableDays, day, setAvailableDays)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border capitalize font-semibold transition-all duration-200',
                availableDays.includes(day)
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40 scale-[1.05]'
                  : 'bg-muted/40 text-foreground/60 border-border/50 hover:border-emerald-400/50 hover:text-emerald-500'
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </section>

      {/* Looking For */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold">What are you looking for?</Label>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR.map(item => (
            <button
              key={item}
              onClick={() => toggle(lookingFor, item, setLookingFor)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border capitalize font-semibold transition-all duration-200',
                lookingFor.includes(item)
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/40 scale-[1.05]'
                  : 'bg-muted/40 text-foreground/60 border-border/50 hover:border-emerald-400/50 hover:text-emerald-500'
              )}
            >
              {item.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-bold">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Preferences</>}
      </Button>
    </div>
  )
}
