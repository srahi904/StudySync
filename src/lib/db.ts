// src/lib/db.ts — Neon serverless + Prisma v7 (works on localhost AND Vercel)
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'

// In Node.js (local dev), we need to provide a WebSocket implementation.
// On Vercel serverless, the Neon driver uses HTTP fetch by default.
if (typeof globalThis.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws')
}

// PrismaNeon (v7.4.2) expects a PoolConfig object, NOT a Pool instance.
// It creates and manages the Pool internally.
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})

// Singleton pattern to avoid multiple PrismaClient instances during hot reload
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
