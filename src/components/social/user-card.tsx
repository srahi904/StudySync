// src/components/social/user-card.tsx
'use client';

import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import { FollowButton } from './follow-button';
import { MapPin, GraduationCap, Users } from 'lucide-react';

interface UserCardProps {
  user: {
    id: string;
    username?: string | null;
    name: string;
    email: string;
    avatar?: string | null;
    image?: string | null;
    bio?: string | null;
    university?: string | null;
    major?: string | null;
    subjects?: string[];
    followersCount: number;
    followingCount?: number;
    isFollowing?: boolean;
  };
  currentUserId: string;
}

export function UserCard({ user, currentUserId }: UserCardProps) {
  const isOwnCard = user.id === currentUserId;
  const avatarUrl = user.avatar || user.image;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.username || user.id}`} className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-border group-hover:ring-primary/30 transition-all">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">{getInitials(user.name)}</span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/profile/${user.username || user.id}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate block">
                {user.name}
              </Link>
              {user.university && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3 h-3" />
                  {user.university}
                </p>
              )}
            </div>

            {!isOwnCard && (
              <FollowButton
                userId={user.id}
                initialFollowing={user.isFollowing || false}
                size="sm"
              />
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              <strong className="text-foreground">{user.followersCount}</strong> followers
            </span>
            {user.subjects && user.subjects.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {user.subjects.slice(0, 3).map((subject) => (
                  <span
                    key={subject}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
