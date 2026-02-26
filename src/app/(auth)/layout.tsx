// src/app/(auth)/layout.tsx
import Link from 'next/link'
import { Zap, Brain, BookOpen, Users, TrendingUp } from 'lucide-react'

const FEATURES = [
  { icon: Brain, text: 'AI-powered study assistant' },
  { icon: BookOpen, text: 'Smart material organization' },
  { icon: Users, text: 'Collaborative study groups' },
  { icon: TrendingUp, text: 'Progress analytics & insights' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Branding — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-card border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-secondary/8" />
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center p-14 w-full">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-xl gradient-text mb-12">
            <Zap className="w-6 h-6 text-primary" />
            StudySync AI
          </Link>

          <h2 className="font-display font-extrabold text-3xl leading-tight mb-3">
            Welcome to your<br />
            <span className="gradient-text">AI study companion</span>
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Join 50,000+ students who use StudySync AI to learn smarter, score higher, and collaborate better.
          </p>

          <ul className="space-y-4">
            {FEATURES.map(f => (
              <li key={f.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 glass rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
              SJ
            </div>
            <div>
              <p className="text-sm italic text-muted-foreground">
                "StudySync AI helped me ace my finals. The AI tutor is genuinely brilliant."
              </p>
              <p className="text-xs font-semibold mt-1">Sarah J. · Stanford University</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg gradient-text mb-8 lg:hidden">
            <Zap className="w-5 h-5 text-primary" />
            StudySync AI
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
