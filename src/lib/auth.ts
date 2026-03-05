// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (was 7)
    updateAge: 24 * 60 * 60, // Refresh token once per day
  },

  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },

  providers: [
    // ─── Credentials (email + password) ───────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email/username and password are required')
        }

        const identifier = credentials.email.toLowerCase()

        // Optimized: select only needed fields
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier }
            ]
          },
          select: {
            id: true,
            name: true,
            username: true, // Added username field
            email: true,
            password: true,
            role: true,
            emailVerified: true,
            onboarded: true,
            avatar: true,
            profileCompleted: true,
          },
        })

        if (!user || !user.password) {
          throw new Error('No account found with this email or username')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password')
        }

        // Update last active (fire-and-forget, don't block login)
        prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        }).catch(() => {})

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      },
    }),

    // ─── Google OAuth ──────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // ─── GitHub OAuth ──────────────────────────────────────
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    // ─── JWT: embed user data into token ──────────────────
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.role = user.role
        token.emailVerified = user.emailVerified
        token.onboarded = user.onboarded
        token.avatar = user.avatar
        token.profileCompleted = user.profileCompleted
      }

      // Handle session updates (e.g. after onboarding or profile edit)
      if (trigger === 'update' && session) {
        token.onboarded = session.onboarded ?? token.onboarded
        token.emailVerified = session.emailVerified ?? token.emailVerified
        token.avatar = session.avatar ?? token.avatar
        token.profileCompleted = session.profileCompleted ?? token.profileCompleted
        if (session.username !== undefined) token.username = session.username
        if (session.name !== undefined) token.name = session.name
      }

      return token
    },

    // ─── Session: expose token data to client ─────────────
    async session({ session, token }) {
      session.user.id = token.id
      session.user.username = token.username
      session.user.role = token.role
      session.user.emailVerified = token.emailVerified
      session.user.onboarded = token.onboarded
      session.user.avatar = token.avatar
      session.user.profileCompleted = token.profileCompleted
      return session
    },

    // ─── Sign-in: handle OAuth user setup ─────────────────
    async signIn({ user, account }) {
      // Allow credentials sign-in through
      if (account?.type === 'credentials') return true

      // For OAuth: auto-verify email + setup username
      if (account?.type === 'oauth' && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, username: true }
        })

        if (dbUser && !dbUser.username) {
          let baseUsername = (user.name || user.email.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
          
          if (baseUsername.length < 5) baseUsername = baseUsername.padEnd(5, '0')
          
          let finalUsername = baseUsername
          let isUnique = false
          let counter = 1

          while (!isUnique) {
            const existing = await prisma.user.findUnique({
              where: { username: finalUsername }
            })
            if (!existing) {
              isUnique = true
            } else {
              finalUsername = `${baseUsername}${counter}`
              counter++
            }
          }

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { 
              username: finalUsername,
              emailVerified: new Date(),
            },
          })
        }
      }

      return true
    },

    // ─── Fast redirect (no extra checks) ──────────────────
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/dashboard'
    },
  },
}
