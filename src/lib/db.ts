// src/lib/db.ts — Neon serverless + Prisma v7 compatible
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'

// Use fetch-based transport on Vercel (no raw WebSockets needed in serverless)
// On local dev, the Pool will use a regular TCP connection automatically
if (typeof WebSocket === 'undefined') {
  // Node.js environment (local dev) — use ws for WebSocket support
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require('ws')
  neonConfig.webSocketConstructor = ws
}

// Create a Neon connection pool using the pooled connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create the Prisma adapter powered by Neon
const adapter = new PrismaNeon(pool)

// Singleton pattern to avoid multiple PrismaClient instances in dev (hot reload)
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
