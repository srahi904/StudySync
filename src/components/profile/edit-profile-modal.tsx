'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Camera, Loader2, User, AtSign, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditProfileModalProps {
  user: any
  onUpdate: (updatedUser: any) => void
}

export function EditProfileModal({ user, onUpdate }: EditProfileModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    avatar: user.avatar || user.image || ''
  })

  // Check if username can be edited (once every 30 days)
  const canEditUsername = () => {
    if (!user.usernameUpdatedAt) return true
    const lastUpdate = new Date(user.usernameUpdatedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastUpdate < thirtyDaysAgo
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast({
      title: 'Uploading avatar...',
      description: 'Please wait while we process your image.'
    })

    try {
      const data = new FormData()
      data.append('file', file)

      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        body: data
      })

      if (!res.ok) throw new Error('Upload failed')
      
      const { url } = await res.json()
      setFormData(prev => ({ ...prev, avatar: url }))
      
      toast({
        title: 'Success!',
        description: 'Avatar uploaded successfully.'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast({
        title: 'Profile updated!',
        description: 'Your changes have been saved successfully.'
      })
      
      onUpdate(data.user)
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const isUsernameLocked = !canEditUsername()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full px-5 font-semibold border-primary/20 hover:bg-primary/5 transition-all">
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-border bg-card shadow-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold font-display">Edit Profile</DialogTitle>
          <p className="text-sm text-muted-foreground">Customize how you appear on StudySync AI.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-muted bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <label className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity",
                  uploading && "opacity-100 pointer-events-none"
                )}>
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Profile Picture</p>
            </div>

            <div className="grid gap-5">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your display name"
                  className="rounded-xl border-border focus:ring-primary/20"
                  required
                />
              </div>

              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-primary" /> Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="unique_username"
                    className={cn(
                      "rounded-xl border-border focus:ring-primary/20 pl-9",
                      isUsernameLocked && "bg-muted cursor-not-allowed opacity-70"
                    )}
                    required
                    disabled={isUsernameLocked}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <AtSign className="w-4 h-4" />
                  </div>
                </div>
                {isUsernameLocked ? (
                  <p className="text-[10px] text-amber-500 font-medium">
                    ⚠ Locked until {new Date(new Date(user.usernameUpdatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-medium">
                    At least 5 characters. Can be changed once every 30 days.
                  </p>
                )}
              </div>

              {/* Bio field */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="rounded-xl border-border focus:ring-primary/20 resize-none min-h-[100px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/30 p-4 sm:p-6 flex flex-row items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-transparent"
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              disabled={loading || uploading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
