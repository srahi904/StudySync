// src/app/(auth)/signup/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Sign up for StudySync AI — free forever.',
}

export default async function SignupPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <>
      <h1 className="font-display font-extrabold text-2xl mb-1">Create your account</h1>
      <p className="text-muted-foreground text-sm mb-8">Join 50,000+ students learning smarter</p>
      <SignupForm />
    </>
  )
}
