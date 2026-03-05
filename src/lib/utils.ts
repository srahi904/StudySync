import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateToken() {
  return require('crypto').randomBytes(32).toString('hex')
}

export function generateSlug(text: string) {
  const shortId = Math.random().toString(36).substring(2, 8)
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
  
  if (!normalized) return shortId
  return `${normalized}-${shortId}`
}

export function addHours(date: Date, hours: number) {
  const newDate = new Date(date)
  newDate.setHours(newDate.getHours() + hours)
  return newDate
}

export function getInitials(name: string) {
  const parts = name.split(' ')
  let initials = ''
  for (let i = 0; i < Math.min(2, parts.length); i++) {
    if (parts[i].length > 0 && parts[i] !== '') {
      initials += parts[i][0]
    }
  }
  return initials.toUpperCase()
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function addMinutes(date: Date, minutes: number) {
  const newDate = new Date(date)
  newDate.setMinutes(newDate.getMinutes() + minutes)
  return newDate
}

export function formatDate(date: string | Date | number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

export function getPasswordStrength(password: string) {
  let score = 0
  if (!password) return { score: 0, label: 'Weak', color: 'bg-red-500' }
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  
  if (score < 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score < 4) return { score, label: 'Good', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}
