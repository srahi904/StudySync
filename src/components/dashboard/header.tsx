'use client'
// src/components/dashboard/header.tsx
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import { GlobalSearch } from './global-search'
import { cn } from '@/lib/utils'

interface HeaderProps {
  collapsed: boolean
  onMenuClick: () => void
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/profile/edit': 'Edit Profile',
  '/settings': 'Settings',
  '/materials': 'Materials',
  '/ai-assistant': 'AI Assistant',
  '/chat': 'Chat',
  '/explore': 'Explore',
  '/groups': 'Groups',
  '/matching': 'Matching',
  '/quizzes': 'Quizzes',
  '/analytics': 'Analytics',
}

export function Header({ collapsed, onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const getBreadcrumb = () => {
    const exact = BREADCRUMB_MAP[pathname]
    if (exact) return exact
    if (pathname.startsWith('/profile/edit')) return 'Edit Profile'
    if (pathname.startsWith('/profile/')) return 'Profile'
    return pathname.split('/').filter(Boolean).pop() || 'Dashboard'
  }
  const breadcrumb = getBreadcrumb()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-[var(--header-height)] border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-4 md:px-6 gap-4 transition-all duration-300',
        collapsed ? 'lg:ml-[var(--sidebar-collapsed)]' : 'lg:ml-[var(--sidebar-width)]'
      )}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h2 className="text-base font-semibold capitalize">{breadcrumb}</h2>
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />

        <button className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        <UserMenu />
      </div>
    </header>
  )
}
