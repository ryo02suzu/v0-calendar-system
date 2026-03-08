/**
 * Unit tests for lib/notifications/email-provider.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EmailProvider } from '@/lib/notifications/email-provider'

describe('EmailProvider', () => {
  let provider: EmailProvider

  beforeEach(() => {
    provider = new EmailProvider()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // Clear all env vars
    delete process.env.EMAIL_PROVIDER
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.SENDGRID_API_KEY
    delete process.env.RESEND_API_KEY
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have type email', () => {
    expect(provider.type).toBe('email')
  })

  it('should dry-run when SMTP env vars are not set', async () => {
    const result = await provider.send({ to: 'test@example.com', subject: 'Test', body: 'Hello' })
    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^dry-run-/)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[EMAIL DRY RUN]'))
  })

  it('should return error when SENDGRID_API_KEY is missing but provider is sendgrid', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid'
    const result = await provider.send({ to: 'test@example.com', body: 'Hello' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('SENDGRID_API_KEY')
  })

  it('should return error when RESEND_API_KEY is missing but provider is resend', async () => {
    process.env.EMAIL_PROVIDER = 'resend'
    const result = await provider.send({ to: 'test@example.com', body: 'Hello' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('RESEND_API_KEY')
  })

  it('should call SendGrid API when configured', async () => {
    process.env.EMAIL_PROVIDER = 'sendgrid'
    process.env.SENDGRID_API_KEY = 'SG.testkey'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      headers: { get: () => 'msg-id-123' },
      text: async () => '',
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: 'test@example.com', subject: 'Sub', body: 'Body' })
    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should call Resend API when configured', async () => {
    process.env.EMAIL_PROVIDER = 'resend'
    process.env.RESEND_API_KEY = 're_testkey'

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'resend-id-123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await provider.send({ to: 'test@example.com', subject: 'Sub', body: 'Body' })
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('resend-id-123')
  })
})
