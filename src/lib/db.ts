// src/lib/db.ts — Optimized Neon serverless connection
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// ═══ NEON WEBSOCKET CONFIG ═══
neonConfig.webSocketConstructor = ws

// ═══ NEON ADAPTER (Connection pooling via config) ═══
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 5000,
  max: 10,
})

// ═══ SINGLETON PATTERN ═══
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
