// src/components/landing/testimonials.tsx
const TESTIMONIALS = [
  {
    quote: 'StudySync AI helped me improve my grades by 20%. The AI assistant is like having a personal tutor available 24/7 — it genuinely changed how I study.',
    name: 'Sarah Johnson',
    role: 'Stanford University · CS Major',
    initials: 'SJ',
    gradient: 'from-primary to-secondary',
  },
  {
    quote: "Best study platform I've ever used. The group features make collaboration effortless. We can all work on the same materials simultaneously — incredible.",
    name: 'Michael Chen',
    role: 'MIT · Electrical Engineering',
    initials: 'MC',
    gradient: 'from-green-500 to-primary',
  },
  {
    quote: 'The AI-generated quizzes are perfect for exam prep. I went from barely passing to top of my class in one semester. Highly recommend to every student!',
    name: 'Priya Sharma',
    role: 'IIT Delhi · Data Science',
    initials: 'PS',
    gradient: 'from-pink-500 to-secondary',
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase mb-3">Student stories</p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">
            Loved by students worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="glass rounded-2xl p-7 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
              <div className="text-yellow-400 mb-4 tracking-widest text-sm">★★★★★</div>
              <p className="text-foreground text-sm leading-relaxed mb-6 italic">
                <span className="text-primary text-2xl leading-none not-italic mr-1">"</span>
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center font-display font-bold text-white text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
