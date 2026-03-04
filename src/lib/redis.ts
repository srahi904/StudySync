// src/lib/redis.ts — Upstash Redis client with cache utilities
import { Redis } from '@upstash/redis'

// ═══ REDIS CLIENT ═══
// Graceful fallback: if credentials are not set, provide a no-op client
const hasRedisCredentials =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = hasRedisCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// ═══ CACHE UTILITIES ═══
export const cache = {
  /** Get cached value or compute + cache it */
  async get<T>(key: string, fallback: () => Promise<T>, ttl = 3600): Promise<T> {
    if (!redis) return fallback()

    try {
      const cached = await redis.get(key)
      if (cached) {
        if (typeof cached === 'string') {
          try { return JSON.parse(cached) } catch { return cached as T }
        }
        return cached as T
      }

      const fresh = await fallback()
      await redis.setex(key, ttl, fresh)
      return fresh
    } catch {
      // Redis error — fall through to DB
      return fallback()
    }
  },

  /** Manually set a cached value */
  async set(key: string, value: unknown, ttl = 3600) {
    if (!redis) return
    try {
      await redis.setex(key, ttl, value)
    } catch {
      // Silently fail — caching is best-effort
    }
  },

  /** Delete a single key */
  async del(key: string) {
    if (!redis) return
    try {
      await redis.del(key)
    } catch {
      // Silently fail
    }
  },

  /** Invalidate keys matching a pattern */
  async invalidate(pattern: string) {
    if (!redis) return
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch {
      // Silently fail
    }
  },
}
