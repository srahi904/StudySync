// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { SignupSchema } from '@/lib/validations'
import { generateOTP, addMinutes } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'
import { encode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

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

    const { name, username, email, password } = result.data

    // ── 2. Check for existing user ───────────────────────
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existing) {
      const message = existing.email === email 
        ? 'An account with this email already exists.'
        : 'This username is already taken.'
      return NextResponse.json({ success: false, message }, { status: 409 })
    }

    // ── 3. Hash password ─────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── 4. Create pending session cookie ────────────────
    const token = await encode({
      token: { name, username, email, password: hashedPassword } as any,
      secret: process.env.NEXTAUTH_SECRET as string,
    })

    const cookieStore = await cookies()
    cookieStore.set('pending_signup', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60, // 10 minutes
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
