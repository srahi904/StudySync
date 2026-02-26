// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ForgotPasswordSchema } from '@/lib/validations'
import { generateToken, addHours } from '@/lib/utils'
import { sendPasswordResetEmail } from '@/lib/email'
import { TokenType } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Validate ──────────────────────────────────────
    const result = ForgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Always return success message to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: "If an account exists with that email, you'll receive a reset link shortly.",
    })

    // ── 2. Look up user ──────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      // OAuth-only user or doesn't exist — return generic success
      return successResponse
    }

    // ── 3. Delete any existing reset tokens ──────────────
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: TokenType.PASSWORD_RESET },
    })

    // ── 4. Generate new reset token ───────────────────────
    const token = generateToken()
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: TokenType.PASSWORD_RESET,
        expires: addHours(new Date(), 1), // 1 hour expiry
      },
    })

    // ── 5. Send reset email ───────────────────────────────
    await sendPasswordResetEmail(user.name, user.email, token)

    return successResponse
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
