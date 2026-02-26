// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) {
          throw new Error('No account found with this email')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Incorrect password')
        }

        // Update last active
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
          onboarded: user.onboarded,
          avatar: user.avatar,
          profileCompleted: user.profileCompleted,
        }
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
        token.role = user.role
        token.emailVerified = user.emailVerified
        token.onboarded = user.onboarded
        token.avatar = user.avatar
        token.profileCompleted = user.profileCompleted
      }

      // Handle session updates (e.g. after onboarding)
      if (trigger === 'update' && session) {
        token.onboarded = session.onboarded ?? token.onboarded
        token.emailVerified = session.emailVerified ?? token.emailVerified
        token.avatar = session.avatar ?? token.avatar
        token.profileCompleted = session.profileCompleted ?? token.profileCompleted
      }

      return token
    },

    // ─── Session: expose token data to client ─────────────
    async session({ session, token }) {
      session.user.id = token.id
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

      // For OAuth: auto-verify email + set defaults
      if (account?.type === 'oauth' && user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            emailVerified: new Date(),
            name: user.name ?? 'User',
          },
        }).catch(() => {}) // Ignore if user doesn't exist yet (first OAuth)
      }

      return true
    },
  },
}
