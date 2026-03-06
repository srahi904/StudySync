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

  // Fast cookie check for existing session (bulletproof in edge environments)
  const hasAuthCookie = 
    request.cookies.has('next-auth.session-token') || 
    request.cookies.has('__Secure-next-auth.session-token')

  // Auth routes — redirect to dashboard if already logged in
  if (['/', '/login', '/signup'].includes(pathname)) {
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If no token and it's a public path, let them through
    return NextResponse.next()
  }

  // Check auth via JWT for protected routes (requires secret)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Other public paths that shouldn't redirect logged-in users
  // but also don't require auth (e.g. /about)
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
