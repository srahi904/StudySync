// src/middleware.ts — Fast JWT-based auth middleware
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ═══ PUBLIC PATHS (No auth check needed) ═══
const publicPaths = [
  '/',
  '/about',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]

// ═══ STATIC PATHS (Skip entirely) ═══
const staticPaths = ['/_next', '/favicon', '/static', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files (FAST — no processing)
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check auth via JWT (no DB query — fast)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Protected routes — redirect to login if not authenticated
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/ai-assistant') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/materials') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/public-chat') ||
    pathname.startsWith('/onboarding')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Auth routes — redirect to dashboard if already logged in
  if (['/login', '/signup'].includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
