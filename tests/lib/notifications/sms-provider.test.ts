/**
 * Unit tests for lib/notifications/sms-provider.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SmsProvider } from '@/lib/notifications/sms-provider'

describe('SmsProvider', () => {
  let provider: SmsProvider

  beforeEach(() => {
    provider = new SmsProvider()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_PHONE_NUMBER
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have type sms', () => {
    expect(provider.type).toBe('sms')
  })

  it('should dry-run when Twilio env vars are not set', async () => {
    const result = await provider.send({ to: '+819012345678', body: 'Test SMS' })
    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^dry-run-sms-/)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[SMS DRY RUN]'))
  })

  it('should call Twilio API when configured', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACtest'
    process.env.TWILIO_AUTH_TOKEN = 'authtoken'
    process.env.TWILIO_PHONE_NUMBER = '+1234567890'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sid: 'SM123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: '+819012345678', body: 'Hello' })
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('SM123')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('twilio.com'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should return error on Twilio API failure', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACtest'
    process.env.TWILIO_AUTH_TOKEN = 'authtoken'
    process.env.TWILIO_PHONE_NUMBER = '+1234567890'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: '+819012345678', body: 'Hello' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Twilio error')
  })
})
