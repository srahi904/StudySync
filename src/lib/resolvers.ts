import { prisma } from '@/lib/db'

export async function resolveMaterialId(idOrSlug: string): Promise<string | null> {
  if (!idOrSlug) return null

  // Fast path for CUID check (starts with 'c' and length ~25)
  if (idOrSlug.startsWith('c') && idOrSlug.length >= 24 && !idOrSlug.includes('-')) {
    const material = await prisma.material.findUnique({
      where: { id: idOrSlug },
      select: { id: true }
    })
    if (material) return material.id
  }

  // Try parsing as slug
  const materialBySlug = await prisma.material.findUnique({
    where: { slug: idOrSlug },
    select: { id: true }
  })
  if (materialBySlug) return materialBySlug.id
  
  // Try raw id as fallback if it didn't look like a CUID initially
  const isCuidLike = idOrSlug.startsWith('c') && idOrSlug.length >= 24 && !idOrSlug.includes('-')
  if (!isCuidLike) {
    const fallback = await prisma.material.findUnique({
      where: { id: idOrSlug },
      select: { id: true }
    })
    return fallback?.id || null
  }

  return null
}

export async function resolveGroupId(idOrSlug: string): Promise<string | null> {
  if (!idOrSlug) return null

  // Fast path for CUID check
  if (idOrSlug.startsWith('c') && idOrSlug.length >= 24 && !idOrSlug.includes('-')) {
    const group = await prisma.studyGroup.findUnique({
      where: { id: idOrSlug },
      select: { id: true }
    })
    if (group) return group.id
  }

  // Try parsing as slug
  const groupBySlug = await prisma.studyGroup.findUnique({
    where: { slug: idOrSlug },
    select: { id: true }
  })
  if (groupBySlug) return groupBySlug.id

  // Try raw id as fallback
  const isCuidLike = idOrSlug.startsWith('c') && idOrSlug.length >= 24 && !idOrSlug.includes('-')
  if (!isCuidLike) {
    const fallback = await prisma.studyGroup.findUnique({
      where: { id: idOrSlug },
      select: { id: true }
    })
    return fallback?.id || null
  }

  return null
}
