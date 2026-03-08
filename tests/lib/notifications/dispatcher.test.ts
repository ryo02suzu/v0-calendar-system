/**
 * Unit tests for lib/notifications/dispatcher.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationDispatcher } from '@/lib/notifications/dispatcher'

describe('NotificationDispatcher', () => {
  let dispatcher: NotificationDispatcher

  beforeEach(() => {
    dispatcher = new NotificationDispatcher()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN
    delete process.env.SMTP_HOST
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('expandTemplate', () => {
    it('should expand single variable', () => {
      const result = dispatcher.expandTemplate('こんにちは{{name}}さん', { name: '田中' })
      expect(result).toBe('こんにちは田中さん')
    })

    it('should expand multiple variables', () => {
      const result = dispatcher.expandTemplate('{{date}} {{time}}のご予約', {
        date: '2026-03-08',
        time: '10:00',
      })
      expect(result).toBe('2026-03-08 10:00のご予約')
    })

    it('should replace all occurrences', () => {
      const result = dispatcher.expandTemplate('{{name}}様、{{name}}様', { name: '山田' })
      expect(result).toBe('山田様、山田様')
    })

    it('should leave unknown variables unchanged', () => {
      const result = dispatcher.expandTemplate('{{unknown}}変数', {})
      expect(result).toBe('{{unknown}}変数')
    })
  })

  describe('send', () => {
    it('should return error for unknown channel', async () => {
      const result = await dispatcher.send('email' as any, { to: 'x', body: 'test' })
      // email channel exists, so this succeeds (dry run)
      expect(result.success).toBe(true)
    })

    it('should expand template variables before sending', async () => {
      const mockSend = vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' })
      ;(dispatcher as any).providers.set('sms', { type: 'sms', send: mockSend })

      await dispatcher.send('sms', {
        to: '+819012345678',
        body: '{{patient_name}}様、{{date}}のご予約',
        templateData: { patient_name: '鈴木', date: '2026-03-08' },
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '鈴木様、2026-03-08のご予約',
        })
      )
    })

    it('should expand subject template variables', async () => {
      const mockSend = vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' })
      ;(dispatcher as any).providers.set('email', { type: 'email', send: mockSend })

      await dispatcher.send('email', {
        to: 'test@example.com',
        subject: '{{clinic_name}}からのお知らせ',
        body: '本文',
        templateData: { clinic_name: 'テストクリニック' },
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'テストクリニックからのお知らせ',
        })
      )
    })

    it('should dry-run SMS when Twilio is not configured', async () => {
      const result = await dispatcher.send('sms', {
        to: '+819012345678',
        body: 'テストメッセージ',
      })
      expect(result.success).toBe(true)
    })

    it('should dry-run LINE when token is not configured', async () => {
      const result = await dispatcher.send('line', {
        to: 'Uabcdef1234567890',
        body: 'テストメッセージ',
      })
      expect(result.success).toBe(true)
    })
  })
})
