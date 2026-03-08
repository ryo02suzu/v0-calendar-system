/**
 * Unit tests for lib/security/rate-limiter.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/lib/security/rate-limiter'

describe('RateLimiter (memory mode)', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    limiter = new RateLimiter()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not limit within quota', async () => {
    const result = await limiter.checkLimit('test-user-1', 10, 60)
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(9)
  })

  it('should limit when quota exceeded', async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.checkLimit('test-user-2', 3, 60)
    }
    const result = await limiter.checkLimit('test-user-2', 3, 60)
    expect(result.limited).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('should track different identifiers independently', async () => {
    await limiter.checkLimit('user-a', 2, 60)
    await limiter.checkLimit('user-a', 2, 60)
    const limitedA = await limiter.checkLimit('user-a', 2, 60)
    const notLimitedB = await limiter.checkLimit('user-b', 2, 60)

    expect(limitedA.limited).toBe(true)
    expect(notLimitedB.limited).toBe(false)
  })

  it('should reset after window expires', async () => {
    // Use very short window (1 second)
    await limiter.checkLimit('test-reset', 1, 1)
    const exceeded = await limiter.checkLimit('test-reset', 1, 1)
    expect(exceeded.limited).toBe(true)

    // Manually expire the entry
    const store = (limiter as any).memoryStore as Map<string, { count: number; resetTime: number }>
    const entry = store.get('test-reset')
    if (entry) entry.resetTime = Date.now() - 1

    const reset = await limiter.checkLimit('test-reset', 1, 1)
    expect(reset.limited).toBe(false)
  })

  it('should provide resetTime in the future', async () => {
    const result = await limiter.checkLimit('test-user-3', 10, 60)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })
})

describe('RateLimiter (redis mode)', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.restoreAllMocks()
  })

  it('should fall back to memory on Redis error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    const limiter = new RateLimiter()
    const result = await limiter.checkLimit('test-redis-fallback', 10, 60)
    expect(result.limited).toBe(false)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Redis rate limit error'),
      expect.any(Error)
    )
  })

  it('should use Redis when available', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => [{ result: 1 }, { result: 1 }],
    })
    vi.stubGlobal('fetch', mockFetch)

    const limiter = new RateLimiter()
    const result = await limiter.checkLimit('test-redis-ok', 100, 900)
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(99)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('upstash.io'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
