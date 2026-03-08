/**
 * Unit tests for lib/notifications/line-provider.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LineProvider } from '@/lib/notifications/line-provider'

describe('LineProvider', () => {
  let provider: LineProvider

  beforeEach(() => {
    provider = new LineProvider()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have type line', () => {
    expect(provider.type).toBe('line')
  })

  it('should dry-run when LINE_CHANNEL_ACCESS_TOKEN is not set', async () => {
    const result = await provider.send({ to: 'Uabcdef1234567890', body: 'Test LINE message' })
    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^dry-run-line-/)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[LINE DRY RUN]'))
  })

  it('should call LINE API when token is configured', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'line-token-abc'

    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: 'Uabcdef1234567890', body: 'Hello' })
    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.line.me/v2/bot/message/push',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should return error on LINE API failure', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'line-token-abc'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: 'Uabcdef1234567890', body: 'Hello' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('LINE error')
  })
})
