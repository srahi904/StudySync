'use client'
// src/components/materials/material-filters.tsx
import { MaterialType, MaterialStatus } from '@prisma/client'
import { getMaterialTypeLabel, getMaterialTypeColor, PREDEFINED_SUBJECTS } from '@/lib/materials/material-utils'
import { cn } from '@/lib/utils'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface MaterialFiltersState {
  types: MaterialType[]
  subjects: string[]
  statuses: MaterialStatus[]
  isPublic?: boolean | undefined
  sortBy: 'date' | 'title' | 'views' | 'downloads'
  sortOrder: 'asc' | 'desc'
}

export const DEFAULT_FILTERS: MaterialFiltersState = {
  types: [],
  subjects: [],
  statuses: [],
  isPublic: undefined,
  sortBy: 'date',
  sortOrder: 'desc',
}

interface MaterialFiltersProps {
  filters: MaterialFiltersState
  onChange: (filters: MaterialFiltersState) => void
  showStatusFilter?: boolean
  showVisibilityFilter?: boolean
  totalCount?: number
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="space-y-2">
      <button
        className="flex items-center justify-between w-full text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && children}
    </div>
  )
}

const ALL_TYPES: MaterialType[] = ['PDF', 'DOCUMENT', 'PRESENTATION', 'SPREADSHEET', 'IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'OTHER']
const ALL_STATUSES: MaterialStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'FAILED']

export function MaterialFilters({
  filters,
  onChange,
  showStatusFilter = false,
  showVisibilityFilter = false,
  totalCount,
}: MaterialFiltersProps) {
  const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item]

  const hasActiveFilters = filters.types.length > 0 || filters.subjects.length > 0 ||
    filters.statuses.length > 0 || filters.isPublic !== undefined

  return (
    <aside className="w-64 flex-shrink-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Filters</span>
          {totalCount !== undefined && (
            <span className="text-xs text-muted-foreground">({totalCount})</span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort By">
        <select
          value={`${filters.sortBy}__${filters.sortOrder}`}
          onChange={e => {
            const [sortBy, sortOrder] = e.target.value.split('__') as [MaterialFiltersState['sortBy'], 'asc' | 'desc']
            onChange({ ...filters, sortBy, sortOrder })
          }}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="date__desc">Newest First</option>
          <option value="date__asc">Oldest First</option>
          <option value="title__asc">Title A-Z</option>
          <option value="title__desc">Title Z-A</option>
          <option value="views__desc">Most Viewed</option>
          <option value="downloads__desc">Most Downloaded</option>
        </select>
      </FilterSection>

      {/* File Type */}
      <FilterSection title="File Type">
        <div className="space-y-1.5">
          {ALL_TYPES.map(type => (
            <label key={type} className="flex items-center gap-2.5 py-0.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.types.includes(type)}
                onChange={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-md border font-medium',
                getMaterialTypeColor(type)
              )}>
                {getMaterialTypeLabel(type)}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Subject */}
      <FilterSection title="Subject" defaultOpen={false}>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {PREDEFINED_SUBJECTS.slice(0, 12).map(subject => (
            <label key={subject} className="flex items-center gap-2 py-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.subjects.includes(subject)}
                onChange={() => onChange({ ...filters, subjects: toggle(filters.subjects, subject) })}
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {subject}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Status filter (own materials only) */}
      {showStatusFilter && (
        <FilterSection title="Status">
          <div className="space-y-1.5">
            {ALL_STATUSES.map(status => (
              <label key={status} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(status)}
                  onChange={() => onChange({ ...filters, statuses: toggle(filters.statuses, status) })}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-xs capitalize">{status.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Visibility (own materials only) */}
      {showVisibilityFilter && (
        <FilterSection title="Visibility">
          <div className="space-y-1.5">
            {[
              { label: 'All', value: undefined },
              { label: 'Public', value: true },
              { label: 'Private', value: false },
            ].map(opt => (
              <label key={String(opt.value)} className="flex items-center gap-2 py-0.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={filters.isPublic === opt.value}
                  onChange={() => onChange({ ...filters, isPublic: opt.value })}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </aside>
  )
}
