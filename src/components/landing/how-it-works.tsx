// src/components/landing/how-it-works.tsx
const STEPS = [
  { num: '1', title: 'Upload Your Materials', desc: 'Drop in PDFs, notes, slides, or any study material. Our AI indexes everything instantly so you can search and query across all content.' },
  { num: '2', title: 'Ask AI Anything', desc: 'Get instant, accurate answers directly from your own materials — no hallucinations, just facts sourced from your content with citations.' },
  { num: '3', title: 'Track Your Progress', desc: 'Monitor study time, quiz performance, and knowledge gaps with intuitive analytics dashboards built for student success.' },
]

export function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase mb-3">Simple process</p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">
            From upload to mastery<br className="hidden sm:block" /> in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-9 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30" />

          {STEPS.map((step, i) => (
            <div key={step.num} className="text-center relative">
              <div className="w-18 h-18 mx-auto mb-6 w-[72px] h-[72px] rounded-full gradient-bg flex items-center justify-center font-display font-extrabold text-2xl text-white shadow-lg shadow-primary/25 relative z-10">
                {step.num}
              </div>
              <h3 className="font-display font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
