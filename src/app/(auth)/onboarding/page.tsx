'use client'
// src/app/(auth)/onboarding/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, GraduationCap, Target, ChevronRight, ChevronLeft } from 'lucide-react'
import { OnboardingSchema, type OnboardingInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

const STEPS = [
  { title: 'Profile Setup', icon: User, desc: 'Tell us a bit about yourself' },
  { title: 'Academic Info', icon: GraduationCap, desc: 'Your university details' },
  { title: 'Study Preferences', icon: Target, desc: 'What are you studying for?' },
]

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering', 'Medicine', 'Business', 'Economics', 'Arts', 'Literature', 'History']
const GOALS = ['Exam Preparation', 'Skill Development', 'Research', 'Homework Help', 'Professional Growth', 'Personal Interest']
const YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i)

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])
  const router = useRouter()
  const { update } = useSession()
  const { toast } = useToast()

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
  })

  const next = async () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const onSubmit = async (data: OnboardingInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, subjects, goals }),
      })
      const json = await res.json()
      if (json.success) {
        await update({ onboarded: true })
        toast({ title: 'Profile complete! 🎉', description: 'Welcome to StudySync AI!' })
        router.push('/dashboard')
      } else {
        toast({ title: 'Error', description: json.message, variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${i <= step ? 'gradient-bg text-white' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" /> })()}
      </div>
      <h1 className="font-display font-extrabold text-2xl mb-1">{STEPS[step].title}</h1>
      <p className="text-muted-foreground text-sm mb-8">{STEPS[step].desc}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Profile */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <textarea
                id="bio"
                placeholder="Tell us a little about yourself..."
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                {...register('bio')}
              />
              {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Academic */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="university">University <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="university" placeholder="e.g. MIT, Stanford, IIT Delhi" {...register('university')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major">Major / Field of Study <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="major" placeholder="e.g. Computer Science, Medicine" {...register('major')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduationYear">Expected Graduation Year <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <select
                id="graduationYear"
                className="flex h-11 w-full rounded-lg border border-input bg-muted px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                {...register('graduationYear', { valueAsNumber: true })}
              >
                <option value="">Select year...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Subjects of interest</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => toggle(subjects, setSubjects, s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${subjects.includes(s) ? 'gradient-bg text-white border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Study goals</Label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => toggle(goals, setGoals, g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${goals.includes(g) ? 'gradient-bg text-white border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="ml-auto"
            onClick={step < STEPS.length - 1 ? next : handleSubmit(onSubmit)}
          >
            Skip
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" onClick={next}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={loading}>
              Complete Setup ✓
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
