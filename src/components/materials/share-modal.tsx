import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface ShareModalProps {
  materialId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ materialId, isOpen, onClose }: ShareModalProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadShares = async () => {
    try {
      const res = await fetch(`/api/materials/share/${materialId}`)
      if (res.ok) {
        const data = await res.json()
        setShares(data.data.shares)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadShares()
      setSearchQuery('')
      setSearchResults([])
    }
  }, [isOpen, materialId])

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    try {
      // In a real app we'd need a robust GET /api/users/search endpoint
      // Using a basic fetch here assuming such an endpoint exists or will exist in Week 11
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        // Filter out users who are already shared
        const existingIds = shares.map(s => s.sharedWithUserId)
        const available = data.data.users.filter((u: any) => !existingIds.includes(u.id))
        setSearchResults(available)
      }
    } catch {
      // ignore
    }
  }

  const addShare = async (userId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materials/share/${materialId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, canDownload: true, canEdit: false })
      })
      if (res.ok) {
        toast({ title: 'User added successfully' })
        setSearchQuery('')
        setSearchResults([])
        loadShares()
      } else {
        toast({ title: 'Failed to add user', variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Error adding user', variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  const removeShare = async (userId: string) => {
    try {
      const res = await fetch(`/api/materials/share/${materialId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (res.ok) {
        toast({ title: 'Access removed' })
        loadShares()
      } else {
        toast({ title: 'Failed to remove access', variant: 'destructive' as any })
      }
    } catch {
      toast({ title: 'Error removing access', variant: 'destructive' as any })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Material</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchUsers(e.target.value)
            }}
          />
          
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto border border-border rounded-xl p-2 bg-muted/20">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.image || user.avatar} />
                      <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => addShare(user.id)}
                    disabled={loading}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />
          
          <div>
            <h4 className="text-sm font-semibold mb-3">Users with access ({shares.length})</h4>
            {shares.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No users have been granted access yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {shares.map(share => (
                  <div key={share.id} className="flex items-center justify-between p-2 border border-border rounded-xl bg-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <Avatar className="w-8 h-8">
                        <AvatarImage src={share.sharedWithUser.image || share.sharedWithUser.avatar} />
                        <AvatarFallback>{share.sharedWithUser.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{share.sharedWithUser.name}</p>
                        <p className="text-xs text-muted-foreground">Can {share.canDownload ? 'Download' : 'View'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => removeShare(share.sharedWithUserId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
