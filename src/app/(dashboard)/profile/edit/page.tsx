'use client'
// src/app/(dashboard)/profile/edit/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateProfileSchema, type UpdateProfileInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Upload, Camera, ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
  })

  const bio = watch('bio', '')

  // Load current profile data
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const u = json.data
          reset({
            name: u.name || '',
            bio: u.bio || '',
            university: u.university || '',
            major: u.major || '',
            graduationYear: u.graduationYear,
            currentYear: u.currentYear || '',
            location: u.location || '',
            phoneNumber: u.phoneNumber || '',
            gender: u.gender,
            linkedinUrl: u.linkedinUrl || '',
            githubUrl: u.githubUrl || '',
            twitterUrl: u.twitterUrl || '',
            websiteUrl: u.websiteUrl || '',
            subjects: u.subjects,
            studyGoals: u.studyGoals,
            preferredStudyTime: u.preferredStudyTime || '',
          })
          setAvatarPreview(u.avatar || u.image)
          setCoverPreview(u.coverPhoto)
        }
      })
  }, [reset])

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: 'Update failed', description: json.message, variant: 'destructive' as any })
        return
      }
      toast({ title: 'Profile updated! ✨', description: 'Your changes have been saved.' })
      router.push('/profile')
      router.refresh()
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        setAvatarPreview(json.data.url)
        toast({ title: 'Avatar updated! 📸' })
      } else {
        toast({ title: 'Upload failed', description: json.message, variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' as any })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/cover', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        setCoverPreview(json.data.url)
        toast({ title: 'Cover photo updated! 🎨' })
      } else {
        toast({ title: 'Upload failed', description: json.message, variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' as any })
    } finally {
      setCoverLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-display font-extrabold">Edit Profile</h1>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6 text-muted-foreground" />
            )}
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> Upload Photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </label>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP. Max 5MB. Auto-compressed.</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Cover Photo</h2>
        <div className="space-y-3">
          <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 flex items-center justify-center">
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
            {coverLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> Upload Cover
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
            </label>
            <p className="text-xs text-muted-foreground">Recommended: 1200×400. Max 10MB. Auto-compressed.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, Country" {...register('location')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Tell others about yourself..."
              {...register('bio')}
            />
            <p className="text-xs text-muted-foreground text-right">{(bio || '').length}/500</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" placeholder="+1 234 567 890" {...register('phoneNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                {...register('gender')}
              >
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="university">University</Label>
              <Input id="university" placeholder="e.g. Stanford University" {...register('university')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major">Major / Field of Study</Label>
              <Input id="major" placeholder="e.g. Computer Science" {...register('major')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentYear">Current Year</Label>
              <select
                id="currentYear"
                className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                {...register('currentYear')}
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input id="graduationYear" type="number" placeholder="2026" {...register('graduationYear', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input id="linkedinUrl" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
              {errors.linkedinUrl && <p className="text-xs text-red-400">Invalid URL</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="githubUrl">GitHub</Label>
              <Input id="githubUrl" placeholder="https://github.com/..." {...register('githubUrl')} />
              {errors.githubUrl && <p className="text-xs text-red-400">Invalid URL</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitterUrl">Twitter / X</Label>
              <Input id="twitterUrl" placeholder="https://twitter.com/..." {...register('twitterUrl')} />
              {errors.twitterUrl && <p className="text-xs text-red-400">Invalid URL</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="websiteUrl">Personal Website</Label>
              <Input id="websiteUrl" placeholder="https://yoursite.com" {...register('websiteUrl')} />
              {errors.websiteUrl && <p className="text-xs text-red-400">Invalid URL</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/profile">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
