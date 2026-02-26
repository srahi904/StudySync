// src/components/landing/features.tsx
import { Brain, BookOpen, MessageSquare, Users, Award, TrendingUp } from 'lucide-react'

const FEATURES = [
  { icon: Brain, label: 'ic-blue', title: 'AI Study Assistant', desc: 'Get instant, context-aware answers powered by RAG AI trained on your uploaded materials.' },
  { icon: BookOpen, label: 'ic-purple', title: 'Smart Materials', desc: 'Upload PDFs, notes, and slides. Organize and search across all your study resources instantly.' },
  { icon: MessageSquare, label: 'ic-green', title: 'Real-Time Chat', desc: 'Connect with study partners through direct messages and live collaborative chat rooms.' },
  { icon: Users, label: 'ic-orange', title: 'Study Groups', desc: 'Create or join study groups, share materials, and collaborate with peers across the globe.' },
  { icon: Award, label: 'ic-pink', title: 'AI-Generated Quizzes', desc: 'Test your knowledge with automatically generated quizzes based on your study materials.' },
  { icon: TrendingUp, label: 'ic-cyan', title: 'Progress Analytics', desc: 'Track study time, quiz scores, and overall progress with detailed performance insights.' },
]

const ICON_COLORS: Record<string, string> = {
  'ic-blue': 'bg-primary/10 text-primary',
  'ic-purple': 'bg-secondary/10 text-secondary',
  'ic-green': 'bg-green-500/10 text-green-400',
  'ic-orange': 'bg-orange-500/10 text-orange-400',
  'ic-pink': 'bg-pink-500/10 text-pink-400',
  'ic-cyan': 'bg-cyan-500/10 text-cyan-400',
}

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase mb-3">Everything you need</p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mb-4">
            Supercharged learning tools
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            From AI-powered tutoring to collaborative study groups — everything you need to excel, in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-7 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${ICON_COLORS[f.label]}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
