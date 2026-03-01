'use client'
// src/components/materials/material-search.tsx
import { useState, useCallback, useRef } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

function useDebounce(fn: (v: string) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  return useCallback((value: string) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(value), delay)
  }, [fn, delay])
}

interface MaterialSearchProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  className?: string
}

export function MaterialSearch({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search materials...',
  className,
}: MaterialSearchProps) {
  const [localValue, setLocalValue] = useState(value)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentMaterialSearches') || '[]')
    } catch { return [] }
  })
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebounce((v: string) => {
    onSearch?.(v)
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocalValue(v)
    onChange?.(v)
    debouncedSearch(v)
    setShowDropdown(v.length === 0 && recentSearches.length > 0)
  }

  const handleSubmit = (searchValue: string) => {
    if (searchValue.trim().length < 2) return
    const updated = [searchValue, ...recentSearches.filter(s => s !== searchValue)].slice(0, 5)
    setRecentSearches(updated)
    try { localStorage.setItem('recentMaterialSearches', JSON.stringify(updated)) } catch {}
    onSearch?.(searchValue)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(localValue)
    if (e.key === 'Escape') setShowDropdown(false)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange?.('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (localValue.length === 0 && recentSearches.length > 0) setShowDropdown(true)
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background',
            'text-sm placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'transition-all'
          )}
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recent searches dropdown */}
      {showDropdown && recentSearches.length > 0 && (
        <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
          <p className="px-3 py-2 text-xs text-muted-foreground font-medium">Recent Searches</p>
          {recentSearches.map(s => (
            <button
              key={s}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              onClick={() => { setLocalValue(s); onChange?.(s); handleSubmit(s) }}
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
