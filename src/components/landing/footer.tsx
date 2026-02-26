// src/components/landing/footer.tsx
import Link from 'next/link'
import { Zap, Twitter, Linkedin, Github } from 'lucide-react'

const COLS = [
  { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#cta' }, { label: 'Blog', href: '#' }, { label: 'Changelog', href: '#' }] },
  { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Press', href: '#' }] },
  { title: 'Legal', links: [{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }, { label: 'Security', href: '#' }, { label: 'Cookies', href: '#' }] },
]

export function Footer() {
  return (
    <footer className="border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-display font-extrabold text-lg gradient-text mb-3">
              <Zap className="w-5 h-5 text-primary" />
              StudySync AI
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-[240px]">
              AI-powered collaborative learning platform for the modern student.
            </p>
            <div className="flex gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} StudySync AI. All rights reserved.</p>
          <p className="text-muted-foreground text-xs">Built with Next.js 15 · Prisma · NextAuth</p>
        </div>
      </div>
    </footer>
  )
}
