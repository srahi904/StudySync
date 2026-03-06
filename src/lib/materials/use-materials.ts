// src/lib/materials/use-materials.ts
// Custom React hook for fetching materials with filters and pagination
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Material, MaterialType, MaterialStatus, User } from '@prisma/client'
import { MaterialFiltersState } from '@/components/materials/material-filters'

type MaterialWithUser = Material & { user?: Pick<User, 'id' | 'name' | 'avatar' | 'image'> }

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

interface UseMaterialsOptions {
  filters: MaterialFiltersState
  page?: number
  limit?: number
  userId?: string
}

export function useMaterials({ filters, page = 1, limit = 20, userId }: UseMaterialsOptions) {
  const [materials, setMaterials] = useState<MaterialWithUser[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  const serializedFilters = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const currentFilters = JSON.parse(serializedFilters) as MaterialFiltersState

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: currentFilters.sortBy,
      sortOrder: currentFilters.sortOrder,
    })

    if (currentFilters.types.length > 0) params.set('type', currentFilters.types[0])
    if (currentFilters.subjects.length > 0) params.set('subject', currentFilters.subjects[0])
    if (currentFilters.statuses.length > 0) params.set('status', currentFilters.statuses[0])
    if (currentFilters.isPublic !== undefined) params.set('isPublic', String(currentFilters.isPublic))
    if (userId) params.set('userId', userId)

    fetch(`/api/materials?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.success) {
          setMaterials(data.data.materials)
          setPagination(data.data.pagination)
        } else {
          setError(data.error || 'Failed to load materials')
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [serializedFilters, page, limit, userId, reloadKey])

  return { materials, pagination, loading, error, reload }
}
