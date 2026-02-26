// src/lib/validations.ts
import { z } from 'zod'

// ─── Password rules ────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// ─── Auth schemas ──────────────────────────────────────────
export const SignupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, 'You must accept the Terms of Service'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const VerifyEmailSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
})

// ─── Onboarding schema ─────────────────────────────────────
export const OnboardingSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  university: z.string().max(100, 'University name too long').optional(),
  major: z.string().max(100, 'Major name too long').optional(),
  graduationYear: z
    .number()
    .int()
    .min(2020)
    .max(2035)
    .optional()
    .or(z.nan().transform(() => undefined)),
})

// ─── Update profile schema ─────────────────────────────────
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional().or(z.literal('')),
  university: z.string().max(100).optional().or(z.literal('')),
  major: z.string().max(100).optional().or(z.literal('')),
  graduationYear: z.number().int().min(2020).max(2035).optional().nullable(),
  currentYear: z.string().max(20).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  subjects: z.array(z.string()).optional(),
  studyGoals: z.array(z.string()).optional(),
  preferredStudyTime: z.string().optional().or(z.literal('')),
})

// ─── Type exports ──────────────────────────────────────────
export type SignupInput = z.infer<typeof SignupSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>
export type OnboardingInput = z.infer<typeof OnboardingSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
