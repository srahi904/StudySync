'use client'
// src/components/groups/group-tabs.tsx
import { useState } from 'react'
import { MessageSquare, BookOpen, Users, Info, ClipboardList } from 'lucide-react'

type Tab = 'chat' | 'materials' | 'members' | 'about' | 'requests'

interface GroupTabsProps {
  children: (activeTab: Tab) => React.ReactNode
  showRequests?: boolean
  requestCount?: number
  defaultTab?: Tab
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'materials', label: 'Materials', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
]

export function GroupTabs({ children, showRequests, requestCount = 0, defaultTab = 'chat' }: GroupTabsProps) {
  const [active, setActive] = useState<Tab>(defaultTab)

  const allTabs = showRequests
    ? [...TABS, { id: 'requests' as Tab, label: 'Requests', icon: <ClipboardList className="h-4 w-4" /> }]
    : TABS

  return (
    <div className="flex flex-col">
      <div className="flex overflow-x-auto border-b border-border/50 mb-6">
        {allTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              active === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'requests' && requestCount > 0 && (
              <span className="ml-1 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center px-1">
                {requestCount}
              </span>
            )}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  )
}
