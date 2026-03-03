// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { ResetPasswordSchema } from '@/lib/validations'
import { TokenType } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── 1. Validate ──────────────────────────────────────
    const result = ResetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    // ── 2. Find token ────────────────────────────────────
    const resetToken = await prisma.verificationToken.findUnique({ where: { token } })

    if (!resetToken || resetToken.type !== TokenType.PASSWORD_RESET) {
      return NextResponse.json(
        { success: false, message: 'Invalid reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    // ── 3. Check expiry ──────────────────────────────────
    if (new Date() > resetToken.expires) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json(
        { success: false, message: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // ── 4. Hash new password ─────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── 5. Update user password ───────────────────────────
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    })

    // ── 6. Delete used token ─────────────────────────────
    await prisma.verificationToken.delete({ where: { token } })

    // ── 7. Invalidate all user sessions ──────────────────
    await prisma.session.deleteMany({
      where: { user: { email: resetToken.identifier } },
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    })
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ── GET: validate token before showing form ──────────────
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required.' }, { status: 400 })
    }

    const resetToken = await prisma.verificationToken.findUnique({ where: { token } })

    if (!resetToken || resetToken.type !== TokenType.PASSWORD_RESET || new Date() > resetToken.expires) {
      return NextResponse.json({ success: false, valid: false, message: 'Invalid or expired token.' })
    }

    return NextResponse.json({ success: true, valid: true })
  } catch (error) {
    console.error('[VALIDATE_TOKEN_ERROR]', error)
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 })
  }
}
