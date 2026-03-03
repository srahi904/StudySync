// src/components/social/follow-button.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onFollowChange?: (following: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function FollowButton({ userId, initialFollowing, onFollowChange, size = 'md', className }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setFollowing(data.following);
      onFollowChange?.(data.following);
    } catch (error) {
      console.error('Follow toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-1.5',
  };

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      className={cn(
        'inline-flex items-center rounded-full font-semibold transition-all duration-200',
        sizeClasses[size],
        following
          ? hover
            ? 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
            : 'bg-muted text-foreground border border-border hover:border-destructive/30'
          : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : following ? (
        hover ? <UserMinus className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      {following ? (hover ? 'Unfollow' : 'Following') : 'Follow'}
    </button>
  );
}
