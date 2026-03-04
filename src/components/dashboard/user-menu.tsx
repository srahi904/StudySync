'use client'
// src/components/dashboard/user-menu.tsx
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const user = session?.user

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all"
      >
        {user.avatar || user.image ? (
          <img src={user.avatar || user.image || ''} alt="" className="w-full h-full object-cover" />
        ) : (
          getInitials(user.name || 'U')
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl py-2 z-[100] animate-in fade-in-0 zoom-in-95 duration-200">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border bg-card">
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <User className="w-4 h-4" /> My Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-border pt-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
