import { Globe, Lock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrivacyBadgeProps {
  visibility: 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';
  sharedCount?: number;
}

export function PrivacyBadge({ visibility, sharedCount = 0 }: PrivacyBadgeProps) {
  const baseClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1 border-transparent"
  
  if (visibility === 'PUBLIC') {
    return (
      <span className={cn(baseClasses, "bg-green-500/10 text-green-600 hover:bg-green-500/20")}>
        <Globe className="w-3 h-3" />
        Public
      </span>
    );
  }

  if (visibility === 'GROUP_ONLY') {
    return (
      <span className={cn(baseClasses, "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20")}>
        <Users className="w-3 h-3" />
        Group Only
      </span>
    );
  }
  
  return (
    <span className={cn(baseClasses, "bg-zinc-500/10 text-zinc-600 hover:bg-zinc-500/20")}>
      <Lock className="w-3 h-3" />
      Private
      {sharedCount > 0 && (
        <span className="text-xs ml-1 font-normal opacity-80">(Shared with {sharedCount})</span>
      )}
    </span>
  );
}
