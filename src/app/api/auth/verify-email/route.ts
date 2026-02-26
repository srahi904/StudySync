// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VerifyEmailSchema } from '@/lib/validations'
import { generateOTP, addMinutes } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'
import { TokenType } from '@prisma/client'

// ── Verify OTP ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Validate ──────────────────────────────────────
    const result = VerifyEmailSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input.' },
        { status: 400 }
      )
    }

    const { email, otp } = result.data

    // ── 2. Find token by email + otp ─────────────────────
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: otp,
        type: TokenType.EMAIL_VERIFICATION,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code. Please try again.' },
        { status: 400 }
      )
    }

    // ── 3. Check expiry ──────────────────────────────────
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } })
      return NextResponse.json(
        { success: false, message: 'This code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // ── 4. Verify user ───────────────────────────────────
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    // ── 5. Delete used token ─────────────────────────────
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: TokenType.EMAIL_VERIFICATION },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    })
  } catch (error) {
    console.error('[VERIFY_EMAIL_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ── Resend OTP ──────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Always return success (don't reveal if email exists)
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, message: 'If unverified, a new code has been sent.' })
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: TokenType.EMAIL_VERIFICATION },
    })

    // Create new OTP
    const otp = generateOTP()
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        type: TokenType.EMAIL_VERIFICATION,
        expires: addMinutes(new Date(), 10),
      },
    })

    // Send OTP email
    await sendVerificationEmail(user.name, user.email, otp)

    return NextResponse.json({ success: true, message: 'A new verification code has been sent.' })
  } catch (error) {
    console.error('[RESEND_VERIFY_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 })
  }
}
