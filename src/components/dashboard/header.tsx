'use client'
// src/components/dashboard/header.tsx
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import { GlobalSearch } from './global-search'
import { NotificationsDropdown } from './notifications-dropdown'
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
        'sticky top-2 z-40 mx-4 md:mx-6 mb-4 h-16 rounded-2xl glass-panel flex items-center px-4 md:px-6 gap-4 transition-all duration-300',
        collapsed ? 'lg:ml-[calc(var(--sidebar-collapsed)+1rem)]' : 'lg:ml-[calc(var(--sidebar-width)+1rem)]'
      )}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted/50 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h2 className="text-base font-bold tracking-tight capitalize">{breadcrumb}</h2>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />

        <NotificationsDropdown />

        <div className="pl-1 border-l border-border/50 h-8 flex items-center ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
