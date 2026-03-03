// src/components/chat/online-indicator.tsx
'use client';

import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineIndicator({ isOnline, size = 'sm', className }: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={cn(
        'rounded-full border-2 border-card inline-block flex-shrink-0',
        sizeClasses[size],
        isOnline ? 'bg-emerald-500' : 'bg-gray-400',
        isOnline && 'animate-pulse',
        className
      )}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}
