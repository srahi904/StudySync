'use client'
// src/components/dashboard/mobile-nav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Plus, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_ITEMS = [
  { label: 'Home', icon: Home, href: '/dashboard' },
  { label: 'Chat', icon: MessageSquare, href: '/chat', disabled: true },
  { label: 'Add', icon: Plus, href: '#', isAction: true },
  { label: 'Alerts', icon: Bell, href: '#', disabled: true },
  { label: 'More', icon: Menu, href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          if (item.isAction) {
            return (
              <button
                key={item.label}
                className="flex flex-col items-center justify-center w-12 h-12 -mt-4 rounded-full gradient-bg text-white shadow-lg shadow-primary/25"
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          }

          if (item.disabled) {
            return (
              <div key={item.label} className="flex flex-col items-center gap-0.5 text-muted-foreground/40 py-1">
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
