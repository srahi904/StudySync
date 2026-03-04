// src/app/(dashboard)/profile/[userId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { FollowButton } from '@/components/social/follow-button';
import { getInitials } from '@/lib/utils';
import {
  ArrowLeft, MapPin, GraduationCap, Calendar, Users, BookOpen,
  Globe, Github, Linkedin, Loader2, Lock, MessageCircle, Eye, Download,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { OnlineIndicator } from '@/components/chat/online-indicator';
import { useActiveList } from '@/components/chat/active-status-provider';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  image?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  currentYear?: string | null;
  location?: string | null;
  subjects: string[];
  studyGoals: string[];
  followersCount: number;
  followingCount: number;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  createdAt: string;
  isOnline?: boolean;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  subject?: string | null;
  visibility: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [followStatus, setFollowStatus] = useState({ following: false, followedBy: false, mutual: false });
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const activeUsers = useActiveList();

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/profile`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProfile(data.user);
        setMaterials(data.materials);
        setFollowStatus(data.followStatus);
        setIsOwnProfile(data.isOwnProfile);
        setTotalMaterials(data.totalMaterials);
        setFollowersCount(data.user.followersCount);
        setFollowingCount(data.user.followingCount);
      } catch {
        router.push('/explore');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleFollowChange = (following: boolean) => {
    setFollowersCount((prev) => prev + (following ? 1 : -1));
    setFollowStatus((prev) => ({
      ...prev,
      following,
      mutual: following && prev.followedBy,
    }));
  };

  const handleMessage = async () => {
    try {
      const res = await fetch('/api/chat/private/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (res.ok) {
        router.push('/chat');
      }
    } catch {
      // handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.avatar || profile.image;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-32 sm:h-44 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10 relative">
          {profile.coverPhoto && (
            <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-card bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white">{getInitials(profile.name)}</span>
                )}
              </div>
              <OnlineIndicator
                isOnline={activeUsers.has(profile.id)}
                size="lg"
                className="absolute bottom-1 right-2 sm:bottom-2 sm:right-3 border-4"
              />
            </div>

            {/* Name + actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">{profile.name}</h1>
                {profile.university && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    {profile.university}
                    {profile.major && ` · ${profile.major}`}
                  </p>
                )}
              </div>

              {!isOwnProfile && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FollowButton
                    userId={profile.id}
                    initialFollowing={followStatus.following}
                    onFollowChange={handleFollowChange}
                  />
                  {followStatus.mutual && (
                    <button
                      onClick={handleMessage}
                      className="px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-4 max-w-xl">{profile.bio}</p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Joined {format(new Date(profile.createdAt), 'MMM yyyy')}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <span className="text-sm">
              <strong className="text-foreground">{followersCount}</strong>{' '}
              <span className="text-muted-foreground">Followers</span>
            </span>
            <span className="text-sm">
              <strong className="text-foreground">{followingCount}</strong>{' '}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span className="text-sm">
              <strong className="text-foreground">{totalMaterials}</strong>{' '}
              <span className="text-muted-foreground">Materials</span>
            </span>
          </div>

          {/* Subjects */}
          {profile.subjects?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.subjects.map((subject) => (
                <span
                  key={subject}
                  className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          <div className="flex items-center gap-3 mt-4">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Materials */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Materials
          </h2>
          <span className="text-sm text-muted-foreground">{totalMaterials} total</span>
        </div>

        {!followStatus.following && !isOwnProfile && totalMaterials > materials.length && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-amber-600 dark:text-amber-400">
              Follow {profile.name} to see their private materials
            </span>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No materials available</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {materials.map((material) => (
              <Link
                key={material.id}
                href={`/materials/${material.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {material.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <span className="uppercase font-medium">{material.type}</span>
                    {material.subject && <span>· {material.subject}</span>}
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> {material.viewCount}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
