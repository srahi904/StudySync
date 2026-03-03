// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to your StudySync AI account.',
}

export default function LoginPage() {
  // Auth redirect handled by middleware — no server-side session check needed
  return (
    <>
      <h1 className="font-display font-extrabold text-2xl mb-1">Welcome back</h1>
      <p className="text-muted-foreground text-sm mb-8">Log in to continue studying</p>
      <LoginForm />
    </>
  )
}
