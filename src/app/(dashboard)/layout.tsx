'use client'
// src/app/(dashboard)/layout.tsx
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { PublicChatPanel } from '@/components/chat/public-chat-panel'
import { ActiveStatusProvider } from '@/components/chat/active-status-provider'
import { GlobalChatListener } from '@/components/chat/global-chat-listener'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isAIAssistantRoute = pathname === '/ai-assistant' || pathname.startsWith('/ai-assistant/')
  const isChatRoute = pathname === '/chat' || pathname.startsWith('/chat/') || pathname === '/public-chat'
  const isFullHeightRoute = isAIAssistantRoute || isChatRoute

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Header
        collapsed={collapsed}
        onMenuClick={() => setMobileOpen(true)}
      />

      <main
        className={cn(
          'transition-all duration-300 pt-0',
          isFullHeightRoute ? 'px-0 pb-0' : 'px-4 md:px-6 lg:px-8 pb-20 lg:pb-8',
          collapsed ? 'lg:ml-[var(--sidebar-collapsed)]' : 'lg:ml-[var(--sidebar-width)]'
        )}
      >
        <div
          className={cn(
            'w-full',
            isFullHeightRoute
              ? 'h-[calc(100vh-var(--header-height))] p-0'
              : 'max-w-7xl mx-auto py-6'
          )}
        >
          {children}
        </div>
      </main>

      {/* Public Chat Panel - visible across all dashboard pages */}
      {!isChatRoute && <PublicChatPanel />}

      <MobileNav />
      <ActiveStatusProvider />
      <GlobalChatListener />
    </div>
  )
}
