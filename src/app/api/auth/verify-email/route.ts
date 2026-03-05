// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { VerifyEmailSchema } from '@/lib/validations'
import { generateOTP, addMinutes } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'
import { TokenType } from '@prisma/client'
import { decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

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
    // Decode the pending user data from the cookie
    const cookieStore = await cookies()
    const pendingSignupCookie = cookieStore.get('pending_signup')

    if (!pendingSignupCookie) {
      return NextResponse.json(
        { success: false, message: 'Signup session expired. Please register again.' },
        { status: 400 }
      )
    }

    const decoded = await decode({
      token: pendingSignupCookie.value,
      secret: process.env.NEXTAUTH_SECRET as string,
    })

    if (!decoded || !decoded.name || !decoded.username || !decoded.email || !decoded.password || decoded.email !== email) {
      return NextResponse.json(
        { success: false, message: 'Invalid signup session. Please register again.' },
        { status: 400 }
      )
    }

    // Check if the user already exists to be safe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (!existingUser) {
      // Create the user now since they are verified
      await prisma.user.create({
        data: {
          name: decoded.name as string,
          username: decoded.username as string,
          email: decoded.email as string,
          password: decoded.password as string,
          emailVerified: new Date(),
        },
      })
    } else if (!existingUser.emailVerified) {
      // If user exists but unverified, just update verification status
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      })
    }

    // clear the pending_signup cookie
    cookieStore.delete('pending_signup')

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

    // We can resend OTP if the user exists but is not verified, 
    // OR if the user is in pending signup state.
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (user && user.emailVerified) {
      // Always return success (don't reveal if email is already verified to prevent enumeration)
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

    // Try to get the name either from the pending cookie or the DB user
    let name = 'User'
    if (user && user.name) {
      name = user.name
    } else {
      const cookieStore = await cookies()
      const pendingSignupCookie = cookieStore.get('pending_signup')
      if (pendingSignupCookie) {
        const decoded = await decode({
          token: pendingSignupCookie.value,
          secret: process.env.NEXTAUTH_SECRET as string,
        })
        if (decoded && decoded.name) {
          name = decoded.name as string
        }
      }
    }

    // Send OTP email
    await sendVerificationEmail(name, email, otp)

    return NextResponse.json({ success: true, message: 'A new verification code has been sent.' })
  } catch (error) {
    console.error('[RESEND_VERIFY_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 })
  }
}
