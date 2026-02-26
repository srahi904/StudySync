'use client'
// src/components/auth/signup-form.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SignupSchema, type SignupInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from './password-input'
import { PasswordStrength } from './password-strength'
import { OAuthButtons } from './oauth-buttons'
import { useToast } from '@/components/ui/use-toast'

export function SignupForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: SignupInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        toast({ title: 'Signup failed', description: json.message, variant: 'destructive' as any })
        return
      }

      toast({ title: 'Account created! 🎉', description: 'Check your email for the verification code.' })
      router.push('/verify-email?email=' + encodeURIComponent(data.email))
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <OAuthButtons />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        Or sign up with email
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="John Doe" autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="Min. 8 characters" autoComplete="new-password" {...register('password')} />
          <PasswordStrength password={password} />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" placeholder="••••••••" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="w-4 h-4 mt-0.5 accent-primary" {...register('terms')} />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.terms && <p className="text-xs text-red-400">{errors.terms.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
