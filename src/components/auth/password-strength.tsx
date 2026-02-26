'use client'
// src/components/auth/password-strength.tsx
import { getPasswordStrength } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const { score, label, color } = getPasswordStrength(password)

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? color : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium transition-colors', score <= 1 ? 'text-red-400' : score <= 2 ? 'text-yellow-400' : 'text-green-400')}>
        {label}
      </p>

      {/* Requirements list */}
      <ul className="space-y-1">
        {REQUIREMENTS.map(req => (
          <li
            key={req.label}
            className={cn('text-xs flex items-center gap-1.5 transition-colors', req.test(password) ? 'text-green-400' : 'text-muted-foreground')}
          >
            <span className="text-[10px]">{req.test(password) ? '✓' : '○'}</span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
