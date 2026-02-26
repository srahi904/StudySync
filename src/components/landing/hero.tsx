'use client'
// src/components/landing/hero.tsx
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background orbs */}
      <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[300px] left-[-200px] w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left: Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 text-xs font-semibold text-primary mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            Powered by Advanced AI
          </div>

          <h1 className="font-display font-extrabold text-4xl md:text-5xl xl:text-6xl leading-[1.08] tracking-tight mb-5">
            Study <span className="gradient-text">Smarter,</span>
            <br />Not Harder
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg">
            Upload your materials, ask AI anything, and collaborate in real-time. The AI-powered study companion built for the modern student.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Button size="xl" asChild>
              <Link href="/signup">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-4 h-4" /> Watch Demo
            </Button>
          </div>

          <div className="flex gap-10">
            {[
              { num: '50K+', label: 'Active Students' },
              { num: '4.9★', label: 'Average Rating' },
              { num: '98%', label: 'Grade Improvement' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display font-extrabold text-2xl text-foreground">{s.num}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI chat card */}
        <div className="hidden lg:flex items-center justify-center relative">
          {/* Floating tag top-right */}
          <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 z-10 animate-float shadow-xl">
            📊 Analytics <span className="text-green-400">↑ 34%</span>
          </div>

          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-float relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/3 pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-xl">🧠</div>
              <div>
                <div className="font-display font-bold text-sm">StudySync AI</div>
                <div className="text-xs text-muted-foreground">Quantum Physics · Chapter 4</div>
              </div>
            </div>

            <div className="ml-auto w-fit bg-primary/12 border border-primary/15 rounded-xl px-4 py-2.5 text-sm text-foreground mb-3 max-w-[85%]">
              Explain quantum entanglement simply
            </div>
            <div className="bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground mb-3 max-w-[90%]">
              Quantum entanglement links two particles — measuring one instantly affects the other, regardless of distance. Einstein called it{' '}
              <em>"spooky action at a distance."</em> 🔬
            </div>
            <div className="flex items-center gap-1.5 py-2 px-1">
              {[0, 200, 400].map(d => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">Generating quiz...</span>
            </div>
          </div>

          {/* Floating tag bottom-left */}
          <div className="absolute -bottom-4 -left-6 glass rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 shadow-xl" style={{ animationDelay: '1s' }}>
            ✅ Quiz Score: 94%
          </div>
        </div>
      </div>
    </section>
  )
}
