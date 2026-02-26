'use client'
// src/app/(auth)/verify-email/page.tsx
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Mail, CheckCircle, XCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const router = useRouter()
  const { toast } = useToast()

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setErrorMessage('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  const handleVerify = async (otpCode: string) => {
    if (otpCode.length !== 6) return
    setLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMessage(json.message)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      setStatus('success')
      toast({ title: 'Email verified! 🎉', description: 'Signing you in...' })

      // Auto sign-in — we need the user's password, but since we just verified,
      // redirect to login for now. The user can sign in with their credentials.
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      toast({ title: 'Code sent!', description: json.message })
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(v => { if (v <= 1) { clearInterval(interval); return 0 } return v - 1 })
      }, 1000)
    } catch {
      toast({ title: 'Failed to resend', description: 'Please try again.', variant: 'destructive' as any })
    } finally {
      setResendLoading(false)
    }
  }

  // ── Success state ──────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="font-display font-extrabold text-2xl mb-2">Email verified! 🎉</h1>
        <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
      </div>
    )
  }

  // ── OTP Input form ─────────────────────────────────────
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>
      <h1 className="font-display font-extrabold text-2xl mb-2">Verify your email</h1>
      <p className="text-muted-foreground text-sm mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-foreground font-semibold text-sm mb-8">
        {email || 'your email address'}
      </p>

      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-3 mb-4" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-xl
              border-2 bg-card text-foreground outline-none
              transition-all duration-200
              focus:border-primary focus:ring-2 focus:ring-primary/20 focus:scale-105
              ${errorMessage ? 'border-red-500/50' : 'border-border'}
            `}
            disabled={loading}
          />
        ))}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
          <XCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      {/* Verify button */}
      <Button
        size="lg"
        className="w-full mb-6"
        onClick={() => handleVerify(otp.join(''))}
        loading={loading}
        disabled={otp.some(d => d === '') || loading}
      >
        {loading ? 'Verifying...' : 'Verify Email'}
      </Button>

      {/* Resend */}
      <div className="glass rounded-xl p-4 mb-6 text-left">
        <p className="text-xs text-muted-foreground mb-2">Didn&apos;t receive the code?</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          loading={resendLoading}
          disabled={resendCooldown > 0}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification code'}
        </Button>
      </div>

      <Link href="/signup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Use a different email
      </Link>
    </div>
  )
}
