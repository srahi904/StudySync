// src/app/layout.tsx
import type { Metadata } from 'next'
import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['300', '400', '500', '600'] })
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-dm-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  title: { default: 'StudySync AI — Study Smarter, Not Harder', template: '%s | StudySync AI' },
  description: 'AI-powered collaborative learning platform. Upload materials, ask AI, collaborate in real-time.',
  keywords: ['study', 'AI', 'learning', 'education', 'quiz', 'flashcards'],
  authors: [{ name: 'StudySync AI' }],
  openGraph: {
    title: 'StudySync AI — Study Smarter, Not Harder',
    description: 'AI-powered collaborative learning platform for students.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-body">
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
