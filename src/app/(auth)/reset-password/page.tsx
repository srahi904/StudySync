'use client'
// src/app/(auth)/reset-password/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, CheckCircle, XCircle } from 'lucide-react'
import { ResetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrength } from '@/components/auth/password-strength'
import { useToast } from '@/components/ui/use-toast'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const router = useRouter()
  const { toast } = useToast()

  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(j => setTokenValid(j.valid === true))
      .catch(() => setTokenValid(false))
  }, [token])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  })

  const password = watch('password', '')

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      } else {
        toast({ title: 'Reset failed', description: json.message, variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (tokenValid === null) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Validating link...</div>
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-display font-extrabold text-2xl mb-2">Link expired</h1>
        <p className="text-muted-foreground text-sm mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button size="lg" className="w-full" asChild>
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    )
  }

  // Success
  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-display font-extrabold text-2xl mb-2">Password reset!</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Your password has been updated. Redirecting you to login in 3 seconds...
        </p>
        <Button size="lg" className="w-full" asChild>
          <Link href="/login">Login Now</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <KeyRound className="w-7 h-7 text-primary" />
      </div>
      <h1 className="font-display font-extrabold text-2xl mb-1">Reset your password</h1>
      <p className="text-muted-foreground text-sm mb-8">Enter a strong new password below</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <input type="hidden" {...register('token')} />

        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" placeholder="Min. 8 characters" autoComplete="new-password" {...register('password')} />
          <PasswordStrength password={password} />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput id="confirmPassword" placeholder="••••••••" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Reset Password
        </Button>
      </form>
    </>
  )
}
