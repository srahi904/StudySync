'use client'
// src/components/dashboard/sidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Home, BookOpen, Bot, MessageSquare, Users, Heart,
  Award, BarChart3, Settings, ChevronLeft, ChevronRight,
  Zap, LogOut, User, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { getInitials } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Materials', icon: BookOpen, href: '/materials', disabled: true },
  { label: 'AI Assistant', icon: Bot, href: '/ai-assistant', disabled: true },
  { label: 'Chat', icon: MessageSquare, href: '/chat', disabled: true },
  { label: 'Groups', icon: Users, href: '/groups', disabled: true },
  { label: 'Matching', icon: Heart, href: '/matching', disabled: true },
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

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-card border-r border-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-[var(--header-height)] border-b border-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold gradient-text">
            <Zap className="w-5 h-5 text-primary flex-shrink-0" />
            {!collapsed && <span className="text-base">StudySync AI</span>}
          </Link>
          {/* Mobile close */}
          <button onClick={onMobileClose} className="lg:hidden text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
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
        </nav>

        {/* Bottom section */}
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

          {/* User card */}
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
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
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
