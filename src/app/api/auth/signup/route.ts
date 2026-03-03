// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { SignupSchema } from '@/lib/validations'
import { generateOTP, addMinutes } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Validate input ────────────────────────────────
    const result = SignupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    // ── 2. Check for existing user ───────────────────────
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // ── 3. Hash password ─────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── 4. Create user ───────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    })

    // ── 5. Generate OTP & send verification email ────────
    const otp = generateOTP()
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        type: 'EMAIL_VERIFICATION',
        expires: addMinutes(new Date(), 10),
      },
    })

    await sendVerificationEmail(name, email, otp)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Check your email for the verification code.',
        data: { user },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[SIGNUP_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
