'use client'
// src/app/(auth)/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        setSent(true)
      } else {
        toast({ title: 'Error', description: json.message, variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-display font-extrabold text-2xl mb-2">Check your inbox</h1>
        <p className="text-muted-foreground text-sm mb-2">
          We sent a reset link to <strong className="text-foreground">{getValues('email')}</strong>
        </p>
        <p className="text-muted-foreground text-xs mb-8">
          The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
        </p>
        <Button variant="ghost" size="lg" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>

      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Mail className="w-7 h-7 text-primary" />
      </div>

      <h1 className="font-display font-extrabold text-2xl mb-1">Forgot your password?</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Enter your email and we&apos;ll send you a reset link
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>
    </>
  )
}
