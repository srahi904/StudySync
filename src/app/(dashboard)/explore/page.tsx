// src/app/(dashboard)/explore/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useInView } from 'react-intersection-observer';
import { UserCard } from '@/components/social/user-card';
import {
  Search, Compass, Users, BookOpen, Loader2, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type FeedType = 'users' | 'materials';

interface ExploreUser {
  id: string;
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
}

interface ExploreMaterial {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  type: string;
  subject?: string | null;
  visibility: string;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    image?: string | null;
    university?: string | null;
  };
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [feedType, setFeedType] = useState<FeedType>('users');
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [materials, setMaterials] = useState<ExploreMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExploreUser[]>([]);
  const [searching, setSearching] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Load feed
  const loadFeed = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('type', feedType);
      params.set('limit', '20');
      if (!reset && cursorRef.current) {
        params.set('cursor', cursorRef.current);
      }

      const res = await fetch(`/api/explore/feed?${params}`);
      const data = await res.json();

      if (data.items) {
        if (feedType === 'users') {
          setUsers((prev) => reset ? data.items : [...prev, ...data.items]);
        } else {
          setMaterials((prev) => reset ? data.items : [...prev, ...data.items]);
        }
        cursorRef.current = data.nextCursor;
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Load feed error:', error);
    } finally {
      setLoading(false);
    }
  }, [feedType, loading]);

  // Initial load
  useEffect(() => {
    cursorRef.current = null;
    setUsers([]);
    setMaterials([]);
    setHasMore(true);
    loadFeed(true);
  }, [feedType]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadFeed();
    }
  }, [inView, hasMore, loading]);

  // Search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/explore/users?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const showSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Explore
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover people and study materials
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search people by name or email..."
          className="w-full rounded-2xl bg-card border border-border pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50 transition-all"
        />
      </div>

      {/* Search results */}
      {showSearch ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">
            {searching ? 'Searching...' : `Search results for "${searchQuery}"`}
          </h2>
          {searching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No users found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((user) => (
                <UserCard key={user.id} user={user} currentUserId={session?.user?.id || ''} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Feed type tabs */}
          <div className="flex gap-2 bg-muted/30 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFeedType('users')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                feedType === 'users'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users className="w-4 h-4" />
              People
            </button>
            <button
              onClick={() => setFeedType('materials')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                feedType === 'materials'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className="w-4 h-4" />
              Materials
            </button>
          </div>

          {/* Feed content */}
          {feedType === 'users' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} currentUserId={session?.user?.id || ''} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/materials/${material.slug || material.id}`}
                  className="bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-0.5"
                >
                  {/* Material type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase">
                      {material.type}
                    </span>
                    {material.subject && (
                      <span className="text-[10px] text-muted-foreground">{material.subject}</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{material.description}</p>
                  )}

                  {/* Author */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      {material.user.avatar || material.user.image ? (
                        <img src={material.user.avatar || material.user.image || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-bold text-white">
                          {material.user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{material.user.name}</span>
                    <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{material.viewCount} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Loading / Load more */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasMore && !loading && (
            <div ref={loadMoreRef} className="h-8" />
          )}

          {!hasMore && !loading && (feedType === 'users' ? users.length : materials.length) > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              You&apos;ve reached the end! 🎉
            </p>
          )}

          {!loading && (feedType === 'users' ? users.length : materials.length) === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Compass className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Nothing to explore yet</p>
              <p className="text-sm mt-1">Be the first to join!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
