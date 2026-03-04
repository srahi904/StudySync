// src/components/groups/privacy-badge.tsx
import { Lock, Globe, UserCheck } from 'lucide-react'

type Privacy = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'

const config: Record<Privacy, { label: string; icon: React.ReactNode; className: string }> = {
  PUBLIC: { label: 'Public', icon: <Globe className="h-3 w-3" />, className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  PRIVATE: { label: 'Private', icon: <Lock className="h-3 w-3" />, className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  INVITE_ONLY: { label: 'Invite Only', icon: <UserCheck className="h-3 w-3" />, className: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' },
}

export function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  const { label, icon, className } = config[privacy]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  )
}
