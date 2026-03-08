/**
 * Redis対応レート制限
 * 環境変数:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Redis未設定時はインメモリフォールバック（既存の実装を使用）
 */
export class RateLimiter {
  private useRedis: boolean
  private memoryStore = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    this.useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  }

  async checkLimit(
    identifier: string,
    maxRequests: number = 100,
    windowSeconds: number = 900
  ): Promise<{
    limited: boolean
    remaining: number
    resetTime: number
  }> {
    if (this.useRedis) {
      return this.checkRedisLimit(identifier, maxRequests, windowSeconds)
    }
    return this.checkMemoryLimit(identifier, maxRequests, windowSeconds)
  }

  private async checkRedisLimit(identifier: string, maxRequests: number, windowSeconds: number) {
    const url = process.env.UPSTASH_REDIS_REST_URL!
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!
    const key = `rate_limit:${identifier}`

    try {
      // INCR + EXPIRE in pipeline
      const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
      })

      const results = await response.json()
      const count = results[0]?.result || 0
      const remaining = Math.max(0, maxRequests - count)

      return {
        limited: count > maxRequests,
        remaining,
        resetTime: Date.now() + windowSeconds * 1000,
      }
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error)
      return this.checkMemoryLimit(identifier, maxRequests, windowSeconds)
    }
  }

  private checkMemoryLimit(identifier: string, maxRequests: number, windowSeconds: number) {
    const now = Date.now()
    let entry = this.memoryStore.get(identifier)

    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowSeconds * 1000 }
      this.memoryStore.set(identifier, entry)
    }

    entry.count++

    return {
      limited: entry.count > maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }
}

export const rateLimiter = new RateLimiter()
