'use client'
// src/components/providers/session-provider.tsx
import { SessionProvider } from 'next-auth/react'

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch every 5 minutes 
      refetchOnWindowFocus={true} // Refetch when the user comes back to the tab
    >
      {children}
    </SessionProvider>
  )
}
