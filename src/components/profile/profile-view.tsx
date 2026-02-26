'use client'
// src/components/profile/profile-view.tsx
import Link from 'next/link'
import {
  MapPin, GraduationCap, Calendar, Pencil,
  ExternalLink, Github, Linkedin, Globe, Twitter,
  BookOpen, Clock, Users, Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getInitials, formatDate } from '@/lib/utils'

interface ProfileUser {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  image: string | null
  bio: string | null
  university: string | null
  major: string | null
  graduationYear: number | null
  currentYear: string | null
  location: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  twitterUrl: string | null
  websiteUrl: string | null
  subjects: string[]
  studyGoals: string[]
  role: string
  createdAt: Date
  lastActiveAt: Date
}

export function ProfileView({ user, isOwn }: { user: ProfileUser; isOwn: boolean }) {
  const avatarSrc = user.avatar || user.image

  return (
    <div className="space-y-6">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-40 md:h-56 rounded-2xl bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 overflow-hidden">
          {user.coverPhoto && (
            <img src={user.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4 px-4 md:px-6 -mt-14 md:-mt-16">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-card border-4 border-background flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xl">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold gradient-text">{getInitials(user.name)}</span>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-display font-extrabold">{user.name}</h1>
                {user.university && (
                  <p className="text-muted-foreground text-sm mt-0.5">{user.major ? `${user.major} · ` : ''}{user.university}</p>
                )}
              </div>
              {isOwn && (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-3 px-1">
        {user.location && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" /> {user.location}
          </span>
        )}
        {user.graduationYear && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="w-3.5 h-3.5" /> Class of {user.graduationYear}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(new Date(user.createdAt))}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Materials', value: '0', icon: BookOpen },
          { label: 'Study Hours', value: '0', icon: Clock },
          { label: 'Groups', value: '0', icon: Users },
          { label: 'XP Points', value: '0', icon: Award },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* About section */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold">About</h2>

        {user.bio ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">
            {isOwn ? 'Add a bio to tell others about yourself.' : 'No bio yet.'}
          </p>
        )}

        {user.subjects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {user.subjects.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {user.studyGoals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Study Goals</h3>
            <div className="flex flex-wrap gap-2">
              {user.studyGoals.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        {(user.linkedinUrl || user.githubUrl || user.twitterUrl || user.websiteUrl) && (
          <div>
            <h3 className="text-sm font-medium mb-2">Links</h3>
            <div className="flex flex-wrap gap-2">
              {user.linkedinUrl && (
                <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
              {user.twitterUrl && (
                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                  <Twitter className="w-3.5 h-3.5" /> Twitter
                </a>
              )}
              {user.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Placeholder tabs for future features */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground/60">Materials and Activity will appear here in future updates.</p>
      </div>
    </div>
  )
}
