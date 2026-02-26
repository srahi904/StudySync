// src/components/landing/cta-section.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section id="cta" className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/8 border border-primary/20 p-16 md:p-20 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(91,142,255,0.1),transparent_60%)] pointer-events-none" />
          <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight mb-4 relative z-10">
            Ready to transform<br />
            <span className="gradient-text">your learning?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 relative z-10">
            Join 50,000+ students learning smarter every day. Free to start.
          </p>
          <div className="flex flex-wrap gap-3 justify-center relative z-10">
            <Button size="xl" asChild>
              <Link href="/signup">
                Start Your Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/login">Login to Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
