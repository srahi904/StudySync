'use client'
// src/components/auth/login-form.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from './password-input'
import { OAuthButtons } from './oauth-buttons'
import { useToast } from '@/components/ui/use-toast'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast({ title: 'Login failed', description: result.error, variant: 'destructive' as any })
      } else {
        toast({ title: 'Welcome back!', description: 'Redirecting to your dashboard...', variant: 'default' as any })
        router.push('/dashboard')
        router.refresh()
      }
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
        Or continue with username or email
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Username or Email</Label>
          <Input id="email" type="text" placeholder="you@example.com or johndoe123" autoComplete="username" {...register('email')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember" className="w-4 h-4 accent-primary" {...register('remember')} />
          <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
            Remember me for 7 days
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
