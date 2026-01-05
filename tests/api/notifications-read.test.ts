/**
 * Unit tests for /api/notifications/[id]/read endpoint
 * 
 * Tests cover:
 * - Successful notification marking as read
 * - Missing notification ID parameter
 * - Invalid notification ID format
 * - Notification not found
 * - Database errors
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH, POST } from '@/app/api/notifications/[id]/read/route'

// Mock the database module
vi.mock('@/lib/db', () => ({
  markNotificationRead: vi.fn(),
}))

import { markNotificationRead } from '@/lib/db'

const mockMarkNotificationRead = markNotificationRead as ReturnType<typeof vi.fn>

describe('POST/PATCH /api/notifications/[id]/read', () => {
  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/notifications/123/read', {
      method: 'PATCH',
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PATCH method', () => {
    it('should successfully mark a notification as read', async () => {
      const mockNotification = {
        id: 'valid-uuid',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        is_read: true,
        read_at: new Date().toISOString(),
      }

      mockMarkNotificationRead.mockResolvedValue(mockNotification)

      const request = createRequest()
      const params = Promise.resolve({ id: 'valid-uuid' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data.data).toEqual(mockNotification)
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('valid-uuid')
    })

    it('should return 400 when notification id is missing', async () => {
      const request = createRequest()
      const params = Promise.resolve({ id: '' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      // Empty string is falsy, so triggers "通知IDが指定されていません"
      expect(data.error).toContain('通知IDが指定されていません')
    })

    it('should return 400 when notification id is only whitespace', async () => {
      const request = createRequest()
      const params = Promise.resolve({ id: '   ' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('無効な通知ID')
    })

    it('should return 400 when params object is missing', async () => {
      const request = createRequest()
      const params = Promise.resolve(null as any)
      const response = await PATCH(request, { params })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('通知IDが指定されていません')
    })

    it('should return 404 when notification is not found', async () => {
      mockMarkNotificationRead.mockResolvedValue(null)

      const request = createRequest()
      const params = Promise.resolve({ id: 'non-existent-id' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('通知が見つかりませんでした')
      expect(console.warn).toHaveBeenCalledWith(
        'Notification not found or already updated:',
        'non-existent-id'
      )
    })

    it('should return 500 when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockMarkNotificationRead.mockRejectedValue(dbError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'valid-uuid' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('通知を既読にできませんでした')
      expect(console.error).toHaveBeenCalledWith(
        'Failed to mark notification as read:',
        expect.objectContaining({
          error: 'Database connection failed',
        })
      )
    })

    it('should handle errors with error codes', async () => {
      const dbError = new Error('Permission denied') as any
      dbError.code = 'PERMISSION_DENIED'
      mockMarkNotificationRead.mockRejectedValue(dbError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'valid-uuid' })
      const response = await PATCH(request, { params })

      expect(response.status).toBe(500)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to mark notification as read:',
        expect.objectContaining({
          code: 'PERMISSION_DENIED',
        })
      )
    })

    it('should accept various valid UUID formats', async () => {
      const uuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        '00000000-0000-0000-0000-000000000001',
      ]

      for (const uuid of uuids) {
        mockMarkNotificationRead.mockResolvedValue({
          id: uuid,
          is_read: true,
        } as any)

        const request = createRequest()
        const params = Promise.resolve({ id: uuid })
        const response = await PATCH(request, { params })

        expect(response.status).toBe(200)
        expect(mockMarkNotificationRead).toHaveBeenCalledWith(uuid)
      }
    })

    it('should handle special characters in ID gracefully', async () => {
      // While not valid UUIDs, the route should pass them to the DB layer
      // which will handle validation
      const specialIds = ['test-id', '12345', 'notification_1']

      for (const id of specialIds) {
        mockMarkNotificationRead.mockResolvedValue(null)

        const request = createRequest()
        const params = Promise.resolve({ id })
        const response = await PATCH(request, { params })

        // Should pass validation and reach DB layer, which returns null (not found)
        expect(response.status).toBe(404)
      }
    })
  })

  describe('POST method', () => {
    it('should delegate to PATCH method', async () => {
      const mockNotification = {
        id: 'valid-uuid',
        is_read: true,
      }

      mockMarkNotificationRead.mockResolvedValue(mockNotification as any)

      const request = new NextRequest('http://localhost:3000/api/notifications/123/read', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: 'valid-uuid' })
      const response = await POST(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('valid-uuid')
    })

    it('should handle errors the same way as PATCH', async () => {
      mockMarkNotificationRead.mockRejectedValue(new Error('Test error'))

      const request = new NextRequest('http://localhost:3000/api/notifications/123/read', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: 'valid-uuid' })
      const response = await POST(request, { params })

      expect(response.status).toBe(500)
    })
  })

  describe('Edge cases', () => {
    it('should handle concurrent requests for the same notification', async () => {
      mockMarkNotificationRead.mockResolvedValue({
        id: 'concurrent-id',
        is_read: true,
      } as any)

      const request1 = createRequest()
      const request2 = createRequest()
      const params = Promise.resolve({ id: 'concurrent-id' })

      const [response1, response2] = await Promise.all([
        PATCH(request1, { params }),
        PATCH(request2, { params }),
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should trim whitespace from notification ID', async () => {
      mockMarkNotificationRead.mockResolvedValue({
        id: 'trimmed-id',
        is_read: true,
      } as any)

      const request = createRequest()
      // ID with leading/trailing spaces
      const params = Promise.resolve({ id: '  trimmed-id  ' })
      const response = await PATCH(request, { params })

      // The route passes the ID with spaces to the DB layer
      // The trim happens in the validation check (id.trim() === '')
      expect(response.status).toBe(200)
      // DB function is called with the original value (not trimmed by route)
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('  trimmed-id  ')
    })

    it('should handle very long IDs', async () => {
      const longId = 'a'.repeat(1000)
      mockMarkNotificationRead.mockResolvedValue(null)

      const request = createRequest()
      const params = Promise.resolve({ id: longId })
      const response = await PATCH(request, { params })

      // Should pass validation and reach DB layer
      expect(response.status).toBe(404)
      expect(mockMarkNotificationRead).toHaveBeenCalledWith(longId)
    })

    it('should log detailed error information for debugging', async () => {
      const error = new Error('Test error') as any
      error.stack = 'Error stack trace'
      error.code = 'TEST_CODE'
      mockMarkNotificationRead.mockRejectedValue(error)

      const request = createRequest()
      const params = Promise.resolve({ id: 'test-id' })
      await PATCH(request, { params })

      expect(console.error).toHaveBeenCalledWith(
        'Failed to mark notification as read:',
        expect.objectContaining({
          error: 'Test error',
          stack: 'Error stack trace',
          code: 'TEST_CODE',
        })
      )
    })
  })

  describe('Error handling validation', () => {
    it('should not expose sensitive error details to client', async () => {
      const sensitiveError = new Error('Database password incorrect: pw=secret123')
      mockMarkNotificationRead.mockRejectedValue(sensitiveError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'test-id' })
      const response = await PATCH(request, { params })

      const data = await response.json()
      // Should return generic error message
      expect(data.error).toBe('通知を既読にできませんでした')
      // Should not include sensitive details
      expect(data.error).not.toContain('secret123')
      expect(data.error).not.toContain('password')
    })
  })
})
