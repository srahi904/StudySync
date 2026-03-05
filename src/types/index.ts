// src/types/index.ts
import { UserRole } from '@prisma/client'
import type { DefaultSession, DefaultUser } from 'next-auth'
import type { DefaultJWT } from 'next-auth/jwt'

// ─── NextAuth type augmentation ───────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string | null
      role: UserRole
      emailVerified: Date | null
      onboarded: boolean
      avatar: string | null
      profileCompleted: boolean
    } & DefaultSession['user']
  }
  interface User extends DefaultUser {
    username: string | null
    role: UserRole
    emailVerified: Date | null
    onboarded: boolean
    avatar: string | null
    profileCompleted: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    username: string | null
    role: UserRole
    emailVerified: Date | null
    onboarded: boolean
    avatar: string | null
    profileCompleted: boolean
  }
}

// ─── API response types ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface SignupData {
  name: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
}

export interface VerifyEmailData {
  token: string
}

export interface OnboardingData {
  bio?: string
  university?: string
  major?: string
  graduationYear?: number
}

// ─── User public profile ───────────────────────────────────
export interface UserProfile {
  id: string
  name: string
  username: string | null
  email: string
  image: string | null
  avatar: string | null
  coverPhoto: string | null
  role: UserRole
  bio: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  currentYear: string | null
  location: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  twitterUrl: string | null
  websiteUrl: string | null
  subjects: string[]
  studyGoals: string[]
  usernameUpdatedAt: Date | null
  createdAt: Date
  lastActiveAt: Date
}

// ─── Dashboard nav types ───────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  disabled?: boolean
}
