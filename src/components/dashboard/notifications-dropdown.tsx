'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Heart, UserPlus, MessageSquare, Info, Check, Trash2, Edit3, Send, Users, Sparkles, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher/client'
import { CHANNELS, EVENTS } from '@/lib/pusher/channels'
import { useToast } from '@/components/ui/use-toast'

type NotificationType = 'LIKE' | 'FOLLOW' | 'MESSAGE' | 'COMMENT' | 'SYSTEM' | 'POST' | 'SHARE' | 'GROUP_INVITE' | 'SUGGEST_USER' | 'SUGGEST_GROUP' | 'JOIN_REQUEST'

interface Notification {
  id: string
  type: NotificationType
  content: string
  link: string | null
  read: boolean
  createdAt: string
  actor: {
    name: string
    image: string | null
    avatar: string | null
  } | null
}

export function NotificationsDropdown() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const pusher = getPusherClient()
  
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (e) {
      console.error('Failed to poll notifications:', e)
    }
  }

  // Initial fetch and Real-time listener
  useEffect(() => {
    fetchNotifications()

    if (!session?.user?.id || !pusher) return

    const channelName = CHANNELS.user(session.user.id)
    const channel = pusher.subscribe(channelName)

    channel.bind(EVENTS.NEW_NOTIFICATION, (data: { notification: Notification }) => {
      setNotifications(prev => [data.notification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      toast({
        title: 'New Notification',
        description: data.notification.content,
        // Click behavior for the toast popup
        action: data.notification.link ? (
          <button onClick={() => router.push(data.notification.link!)} className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md">
            View
          </button>
        ) : undefined
      })
    })

    return () => {
      channel.unbind(EVENTS.NEW_NOTIFICATION)
      pusher.unsubscribe(channelName)
    }
  }, [session?.user?.id, pusher, router, toast])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAsRead = async (id: string, link: string | null) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    
    if (link) {
      router.push(link)
      setOpen(false)
    }
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', { method: 'PATCH' })
  }

  const clearAll = async () => {
    setNotifications([])
    setUnreadCount(0)
    await fetch('/api/notifications', { method: 'DELETE' })
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
      case 'FOLLOW': return <UserPlus className="w-3.5 h-3.5 text-blue-500" />
      case 'MESSAGE': return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
      case 'COMMENT': return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
      case 'POST': return <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
      case 'SHARE': return <Send className="w-3.5 h-3.5 text-cyan-500" />
      case 'GROUP_INVITE': return <Users className="w-3.5 h-3.5 text-orange-500" />
      case 'SUGGEST_USER': return <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      case 'SUGGEST_GROUP': return <Sparkles className="w-3.5 h-3.5 text-amber-500" />
      case 'JOIN_REQUEST': return <UserCheck className="w-3.5 h-3.5 text-teal-500" />
      default: return <Info className="w-3.5 h-3.5 text-primary" />
    }
  }

  return (
    <div ref={ref} className="relative flex items-center">
      <button 
        onClick={() => setOpen(!open)}
        className={cn(
          "p-2.5 rounded-xl transition-colors relative",
          open ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] border-2 border-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[3.25rem] w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl z-[100] animate-in fade-in-0 slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/10">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex gap-1.5">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto hide-scrollbar overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) {
                        markAsRead(notif.id, notif.link)
                      } else if (notif.link) {
                        router.push(notif.link)
                        setOpen(false)
                      }
                    }}
                    className={cn(
                      "p-4 flex gap-3 hover:bg-muted/40 transition-colors cursor-pointer relative",
                      !notif.read ? "bg-primary/5" : ""
                    )}
                  >
                    {!notif.read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                    )}
                    <div className="relative shrink-0 ml-1">
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-1 ring-border shadow-sm">
                        {notif.actor?.avatar || notif.actor?.image ? (
                          <img src={notif.actor.avatar || notif.actor.image!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-semibold text-sm text-muted-foreground">{notif.actor?.name?.charAt(0) || 'S'}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-[3px] rounded-full bg-card shadow-sm border border-border/50">
                        {getIcon(notif.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className={cn(
                        "text-sm leading-[1.3] break-words",
                        !notif.read ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {notif.content}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
