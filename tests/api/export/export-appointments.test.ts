/**
 * Unit tests for /api/export/appointments
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  getAppointmentsByDateRange: vi.fn(),
  getAppointments: vi.fn(),
}))

vi.mock('@/lib/auth/server', () => ({
  getServerAuth: vi.fn().mockResolvedValue({
    authenticated: true,
    user: { id: 'test-user', email: 'test@example.com', role: 'admin', clinicId: 'test-clinic' },
  }),
  checkServerPermission: vi.fn().mockReturnValue(true),
}))

import { getAppointmentsByDateRange, getAppointments } from '@/lib/db'
import { GET } from '@/app/api/export/appointments/route'

const mockGetAppointments = getAppointments as ReturnType<typeof vi.fn>
const mockGetByDateRange = getAppointmentsByDateRange as ReturnType<typeof vi.fn>

const mockAppointments = [
  {
    id: 'apt-1',
    date: '2026-03-08',
    start_time: '10:00',
    end_time: '10:30',
    patient: { name: '田中太郎' },
    staff: { name: '山田医師' },
    treatment_type: '定期検診',
    status: 'confirmed',
    chair_number: 1,
    notes: '',
  },
]

describe('GET /api/export/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return CSV by default', async () => {
    mockGetAppointments.mockResolvedValue(mockAppointments)

    const request = new NextRequest('http://localhost:3000/api/export/appointments')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/csv')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    const text = await response.text()
    expect(text).toContain('予約ID')
    expect(text).toContain('田中太郎')
  })

  it('should return HTML when format=pdf', async () => {
    mockGetAppointments.mockResolvedValue(mockAppointments)

    const request = new NextRequest('http://localhost:3000/api/export/appointments?format=pdf')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<!DOCTYPE html>')
    expect(text).toContain('予約一覧')
  })

  it('should use date range when from and to are provided', async () => {
    mockGetByDateRange.mockResolvedValue(mockAppointments)

    const request = new NextRequest(
      'http://localhost:3000/api/export/appointments?from=2026-01-01&to=2026-03-31'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetByDateRange).toHaveBeenCalledWith('2026-01-01', '2026-03-31')
    expect(mockGetAppointments).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    mockGetAppointments.mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost:3000/api/export/appointments')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })
})
