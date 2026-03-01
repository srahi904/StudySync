'use client'
// src/components/materials/delete-modal.tsx
import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  materialTitle: string
}

export function DeleteModal({ isOpen, onClose, onConfirm, materialTitle }: DeleteModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl',
        'animate-in fade-in zoom-in-95 duration-200'
      )}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Delete Material</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">"{materialTitle}"</span>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
