'use client'
// src/components/dashboard/sidebar.tsx
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Home, BookOpen, Bot, MessageSquare, Users, Heart,
  Award, BarChart3, Settings, ChevronLeft, ChevronRight,
  Zap, X, Share2, Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { usePusherMulti } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Materials', icon: BookOpen, href: '/materials' },
  { label: 'Shared With Me', icon: Share2, href: '/materials/shared-with-me' },
  { label: 'AI Assistant', icon: Bot, href: '/ai-assistant' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Groups', icon: Users, href: '/groups' },

  { label: 'Matching', icon: Heart, href: '/matching' },
  { label: 'Quizzes', icon: Award, href: '/quizzes', disabled: true },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', disabled: true },
]

const BOTTOM_ITEMS = [
  { label: 'Settings', icon: Settings, href: '/settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/private/unread-count')
      const data = await res.json()
      setUnreadChatCount(data.unreadCount || 0)
    } catch (err) {}
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount()
    }
  }, [session?.user?.id, fetchUnreadCount])

  usePusherMulti({
    channelName: session?.user?.id ? CHANNELS.user(session.user.id) : '',
    events: {
      [EVENTS.CONVERSATION_UPDATED]: () => {
        fetchUnreadCount()
      },
      [EVENTS.MESSAGE_READ]: () => {
        fetchUnreadCount()
      }
    },
    enabled: !!session?.user?.id
  })

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-card/80 backdrop-blur-xl border-r border-border/60 flex flex-col transition-all duration-300',
          collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 h-[var(--header-height)] border-b border-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold gradient-text">
            <Zap className="w-5 h-5 text-primary flex-shrink-0" />
            {!collapsed && <span className="text-base">StudySync AI</span>}
          </Link>
          <button onClick={onMobileClose} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={cn('sidebar-item sidebar-item-disabled', collapsed && 'justify-center px-0')}
                  title={collapsed ? `${item.label} (Coming Soon)` : 'Coming Soon'}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/60">Soon</span>
                    </>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'sidebar-item relative',
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  collapsed && 'justify-center px-0'
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.href === '/chat' && collapsed && unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.href === '/chat' && unreadChatCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'sidebar-item',
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {!collapsed && user && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-2 bg-muted/30">
              <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                {user.avatar || user.image ? (
                  <img src={user.avatar || user.image || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name || 'U')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  { (user as any).username ? `@${(user as any).username}` : user.email }
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="hidden lg:flex sidebar-item sidebar-item-inactive justify-center w-full"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!collapsed && <span className="flex-1 text-left">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
