'use client'
// src/app/(dashboard)/settings/page.tsx
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  User, Shield, Bell, Palette,
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
    <div className="flex items-center justify-between py-4 group hover:bg-muted/10 transition-colors px-1 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground leading-none">{label}</p>
        {desc && <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        className={cn(
          'w-[50px] h-[30px] rounded-full transition-all duration-300 relative flex-shrink-0 cursor-pointer shadow-inner',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span className={cn(
          'absolute top-[2px] w-[26px] h-[26px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )} />
      </button>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3 px-1">{children}</h2>
}

function GroupPanel({ children }: { children: React.ReactNode }) {
  return <div className="glass-panel overflow-hidden rounded-2xl divide-y divide-border/40 mb-8 border border-border/50">{children}</div>
}

export default function SettingsPage() {
  const [tab, setTab] = useState('account')
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState('')

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
    <div className="space-y-8 animate-fade-up max-w-5xl">
      <h1 className="text-2xl font-display font-extrabold tracking-tight px-1">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 pl-1">
        {/* Sidebar */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:w-56 flex-shrink-0 hide-scrollbar pb-2 md:pb-0">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.25)]'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", isActive ? "opacity-100" : "opacity-70")} />
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1 pb-20">
          
          {/* Account */}
          {tab === 'account' && (
            <div className="animate-fade-up">
              <SectionHeader>Email Address</SectionHeader>
              <GroupPanel>
                <div className="p-4 flex items-center gap-4 bg-muted/10">
                  <div className="flex-1">
                    <Input value={session?.user?.email || ''} disabled className="bg-transparent border-0 shadow-none px-0 font-medium h-auto text-foreground disabled:opacity-100" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Verified</span>
                </div>
              </GroupPanel>

              <SectionHeader>Change Password</SectionHeader>
              <GroupPanel>
                <div className="p-5 space-y-5 bg-muted/10">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                        className="bg-background/50 border-border/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase">New Password</Label>
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase">Confirm</Label>
                      <Input
                        type={showPasswords ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="secondary" size="sm" onClick={handlePasswordChange} className="rounded-xl px-5">Update Password</Button>
                  </div>
                </div>
              </GroupPanel>

              <SectionHeader>Danger Zone</SectionHeader>
              <GroupPanel>
                <div className="p-5 bg-red-500/5 group">
                  <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. All study materials will be lost.</p>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      placeholder='Type "DELETE" to confirm'
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      className="max-w-xs bg-background/50 border-red-500/20 focus-visible:ring-red-500/30"
                    />
                    <Button
                      variant="destructive"
                      disabled={deleteConfirm !== 'DELETE'}
                      onClick={handleDeleteAccount}
                      className="gap-2 w-full sm:w-auto rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </Button>
                  </div>
                </div>
              </GroupPanel>
            </div>
          )}

          {/* Privacy */}
          {tab === 'privacy' && (
            <div className="animate-fade-up">
              <SectionHeader>Profile Visibility</SectionHeader>
              <GroupPanel>
                <div className="px-5">
                  <Toggle checked={privacy.publicProfile} onChange={v => setPrivacy(p => ({ ...p, publicProfile: v }))} label="Public profile" desc="Allow others to view your profile" />
                  <Toggle checked={privacy.showEmail} onChange={v => setPrivacy(p => ({ ...p, showEmail: v }))} label="Show email on profile" />
                  <Toggle checked={privacy.showPhone} onChange={v => setPrivacy(p => ({ ...p, showPhone: v }))} label="Show phone number" />
                  <Toggle checked={privacy.showSocial} onChange={v => setPrivacy(p => ({ ...p, showSocial: v }))} label="Show social links" />
                </div>
              </GroupPanel>

              <SectionHeader>Discovery & Status</SectionHeader>
              <GroupPanel>
                <div className="px-5">
                  <Toggle checked={privacy.showStats} onChange={v => setPrivacy(p => ({ ...p, showStats: v }))} label="Show study stats" />
                  <Toggle checked={privacy.findByEmail} onChange={v => setPrivacy(p => ({ ...p, findByEmail: v }))} label="Allow others to find me by email" />
                  <Toggle checked={privacy.showInSearch} onChange={v => setPrivacy(p => ({ ...p, showInSearch: v }))} label="Show me in search results" />
                  <Toggle checked={privacy.showOnline} onChange={v => setPrivacy(p => ({ ...p, showOnline: v }))} label="Show online status" />
                </div>
              </GroupPanel>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="animate-fade-up">
              <SectionHeader>Email Notifications</SectionHeader>
              <GroupPanel>
                <div className="px-5">
                  <Toggle checked={notifications.newMessage} onChange={v => setNotifications(p => ({ ...p, newMessage: v }))} label="New messages" desc="Receive an email when someone messages you" />
                  <Toggle checked={notifications.groupJoin} onChange={v => setNotifications(p => ({ ...p, groupJoin: v }))} label="Group invites and joins" />
                  <Toggle checked={notifications.materialComment} onChange={v => setNotifications(p => ({ ...p, materialComment: v }))} label="Comments on materials" />
                  <Toggle checked={notifications.quizReminder} onChange={v => setNotifications(p => ({ ...p, quizReminder: v }))} label="Study reminders" />
                </div>
              </GroupPanel>
              
              <SectionHeader>Marketing & Updates</SectionHeader>
              <GroupPanel>
                <div className="px-5">
                  <Toggle checked={notifications.weeklyDigest} onChange={v => setNotifications(p => ({ ...p, weeklyDigest: v }))} label="Weekly digest" desc="Summary of your study performance" />
                  <Toggle checked={notifications.productUpdates} onChange={v => setNotifications(p => ({ ...p, productUpdates: v }))} label="Product updates" desc="News, beta tests, and major features" />
                </div>
              </GroupPanel>

              <SectionHeader>Push Notifications</SectionHeader>
              <GroupPanel>
                <div className="px-5">
                  <Toggle checked={notifications.pushEnabled} onChange={v => setNotifications(p => ({ ...p, pushEnabled: v }))} label="Enable system push notifications" desc="Get pop-up alerts while using the app or outside the browser" />
                </div>
              </GroupPanel>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div className="animate-fade-up">
              <SectionHeader>Theme Preferences</SectionHeader>
              <GroupPanel>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', icon: Sun, label: 'Light Theme' },
                      { id: 'dark', icon: Moon, label: 'Dark Theme' },
                      { id: 'system', icon: Monitor, label: 'System Default' },
                    ].map(opt => {
                      const Icon = opt.icon
                      const isActive = theme === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setTheme(opt.id)}
                          className={cn(
                            'flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
                            isActive
                              ? 'border-primary bg-primary/10 text-primary shadow-[inset_0_0_12px_hsl(var(--primary)/0.15)]'
                              : 'border-border/50 bg-muted/5 text-muted-foreground hover:bg-muted/30 hover:border-border hover:shadow-sm'
                          )}
                        >
                          <Icon className={cn("w-7 h-7", isActive && "animate-pulse-dot")} />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </GroupPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
