'use client'
// src/app/(dashboard)/settings/page.tsx
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  User, Lock, Shield, Bell, Palette, ChevronRight,
  Eye, EyeOff, Trash2, Moon, Sun, Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState('account')
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  // Settings state (stored locally - will be API-backed in future)
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEmail: false,
    showPhone: false,
    showSocial: true,
    showStats: true,
    findByEmail: true,
    showInSearch: true,
    showOnline: true,
  })

  const [notifications, setNotifications] = useState({
    newMessage: true,
    groupJoin: true,
    materialComment: true,
    quizReminder: true,
    weeklyDigest: true,
    productUpdates: false,
    pushEnabled: false,
  })

  // Password change
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState(false)

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' as any })
      return
    }
    if (passwords.new.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' as any })
      return
    }
    toast({ title: 'Password updated ✓', description: 'Your password has been changed.' })
    setPasswords({ current: '', new: '', confirm: '' })
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    toast({ title: 'Account deletion', description: 'This feature will be available in a future update.' })
    setDeleteConfirm('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-extrabold">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:w-52 flex-shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Account */}
          {tab === 'account' && (
            <div className="space-y-6">
              {/* Email */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Email Address</h2>
                <div className="flex items-center gap-3">
                  <Input value={session?.user?.email || ''} disabled className="flex-1" />
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Verified</span>
                </div>
              </div>

              {/* Password */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold">Change Password</h2>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>New Password</Label>
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirm</Label>
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePasswordChange}>Update Password</Button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-card border border-red-500/30 rounded-2xl p-6 space-y-4">
                <h2 className="font-semibold text-red-400">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back.</p>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder='Type "DELETE" to confirm'
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteConfirm !== 'DELETE'}
                    onClick={handleDeleteAccount}
                    className="gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy */}
          {tab === 'privacy' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-1 divide-y divide-border/50">
              <h2 className="font-semibold pb-3">Profile Visibility</h2>
              <Toggle checked={privacy.publicProfile} onChange={v => setPrivacy(p => ({ ...p, publicProfile: v }))} label="Public profile" desc="Allow others to view your profile" />
              <Toggle checked={privacy.showEmail} onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))} label="Show email on profile" />
              <Toggle checked={privacy.showPhone} onChange={v => setPrivacy(p => ({ ...p, showPhone: v }))} label="Show phone number" />
              <Toggle checked={privacy.showSocial} onChange={v => setPrivacy(p => ({ ...p, showSocial: v }))} label="Show social links" />
              <Toggle checked={privacy.showStats} onChange={v => setPrivacy(p => ({ ...p, showStats: v }))} label="Show study stats" />
              <Toggle checked={privacy.findByEmail} onChange={v => setPrivacy(p => ({ ...p, findByEmail: v }))} label="Allow others to find me by email" />
              <Toggle checked={privacy.showInSearch} onChange={v => setPrivacy(p => ({ ...p, showInSearch: v }))} label="Show me in search results" />
              <Toggle checked={privacy.showOnline} onChange={v => setPrivacy(p => ({ ...p, showOnline: v }))} label="Show online status" />
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-1 divide-y divide-border/50">
                <h2 className="font-semibold pb-3">Email Notifications</h2>
                <Toggle checked={notifications.newMessage} onChange={v => setNotifications(p => ({ ...p, newMessage: v }))} label="New message received" />
                <Toggle checked={notifications.groupJoin} onChange={v => setNotifications(p => ({ ...p, groupJoin: v }))} label="Someone joined my group" />
                <Toggle checked={notifications.materialComment} onChange={v => setNotifications(p => ({ ...p, materialComment: v }))} label="Comment on my material" />
                <Toggle checked={notifications.quizReminder} onChange={v => setNotifications(p => ({ ...p, quizReminder: v }))} label="Quiz reminders" />
                <Toggle checked={notifications.weeklyDigest} onChange={v => setNotifications(p => ({ ...p, weeklyDigest: v }))} label="Weekly summary digest" />
                <Toggle checked={notifications.productUpdates} onChange={v => setNotifications(p => ({ ...p, productUpdates: v }))} label="Product updates" />
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-1 divide-y divide-border/50">
                <h2 className="font-semibold pb-3">Push Notifications</h2>
                <Toggle checked={notifications.pushEnabled} onChange={v => setNotifications(p => ({ ...p, pushEnabled: v }))} label="Enable push notifications" desc="Get notified in your browser" />
              </div>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h2 className="font-semibold">Theme</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                        theme === opt.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
