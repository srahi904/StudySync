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
        <div className="flex flex-col gap-6 items-start">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 text-xs font-semibold text-primary tracking-wide animate-fade-up" style={{ animationFillMode: 'both' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            Powered by Advanced AI
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-6xl xl:text-7xl leading-[1.05] tracking-tighter animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            Study <span className="gradient-text">Smarter,</span>
            <br />Not Harder
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            Upload your materials, ask AI anything, and collaborate in real-time. The AI-powered study companion built for the modern student.
          </p>

          <div className="flex flex-wrap gap-4 mt-4 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <Button size="xl" className="shadow-[0_0_24px_hsl(var(--primary)/0.4)] transition-all hover:scale-105" asChild>
              <Link href="/signup">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="glass-panel hover:bg-muted/50 transition-all hover:scale-105 border-border/50" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              <Play className="w-4 h-4 mr-2" /> Watch Demo
            </Button>
          </div>

          <div className="flex gap-10 mt-6 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            {[
              { num: '50K+', label: 'Active Students' },
              { num: '4.9★', label: 'Average Rating' },
              { num: '98%', label: 'Grade Improvement' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display font-extrabold text-3xl text-foreground">{s.num}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI chat card */}
        <div className="hidden lg:flex items-center justify-center relative animate-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          {/* Floating tag top-right */}
          <div className="absolute -top-6 -right-6 glass-panel rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 z-20 animate-float shadow-2xl">
            📊 Analytics <span className="text-emerald-400">↑ 34%</span>
          </div>

          <div className="glass-panel rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden ring-1 ring-white/5 group hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-2xl shadow-lg shadow-primary/20">🧠</div>
              <div>
                <div className="font-display font-bold text-base text-foreground">StudySync AI</div>
                <div className="text-sm text-muted-foreground">Quantum Physics · Chapter 4</div>
              </div>
            </div>

            <div className="ml-auto w-fit bg-primary text-primary-foreground shadow-md rounded-2xl rounded-tr-sm px-4 py-3 text-sm mb-4 max-w-[85%] relative z-10">
              Explain quantum entanglement simply
            </div>
            <div className="bg-muted/80 backdrop-blur-md border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground mb-4 max-w-[90%] relative z-10">
              Quantum entanglement links two particles — measuring one instantly affects the other, regardless of distance. Einstein called it{' '}
              <em className="text-primary font-medium">"spooky action at a distance."</em> 🔬
            </div>
            <div className="flex items-center gap-2 py-2 px-1 relative z-10">
              <div className="flex gap-1">
                {[0, 200, 400].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium animate-pulse ml-1">Generating quiz...</span>
            </div>
          </div>

          {/* Floating tag bottom-left */}
          <div className="absolute -bottom-6 -left-8 glass-panel rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 z-20 shadow-2xl" style={{ animationDelay: '1s', animationFillMode: 'both' }}>
            ✅ Quiz Score: 94%
          </div>
        </div>
      </div>
    </section>
  )
}
