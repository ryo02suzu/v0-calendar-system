/**
 * Unit tests for /api/export/patients
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  getPatients: vi.fn(),
}))

vi.mock('@/lib/auth/server', () => ({
  getServerAuth: vi.fn().mockResolvedValue({
    authenticated: true,
    user: { id: 'test-user', email: 'test@example.com', role: 'admin', clinicId: 'test-clinic' },
  }),
  checkServerPermission: vi.fn().mockReturnValue(true),
}))

import { getPatients } from '@/lib/db'
import { GET } from '@/app/api/export/patients/route'

const mockGetPatients = getPatients as ReturnType<typeof vi.fn>

const mockPatients = [
  {
    id: 'p-1',
    patient_number: 'P001',
    name: '鈴木花子',
    name_kana: 'スズキハナコ',
    date_of_birth: '1990-01-01',
    gender: 'female',
    phone: '090-1234-5678',
    email: 'hanako@example.com',
    address: '東京都',
    allergies: ['ペニシリン'],
  },
]

describe('GET /api/export/patients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return CSV by default', async () => {
    mockGetPatients.mockResolvedValue(mockPatients)

    const request = new NextRequest('http://localhost:3000/api/export/patients')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/csv')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    const text = await response.text()
    expect(text).toContain('患者番号')
    expect(text).toContain('鈴木花子')
  })

  it('should return HTML when format=pdf', async () => {
    mockGetPatients.mockResolvedValue(mockPatients)

    const request = new NextRequest('http://localhost:3000/api/export/patients?format=pdf')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/html')
    const text = await response.text()
    expect(text).toContain('<!DOCTYPE html>')
    expect(text).toContain('患者一覧')
  })

  it('should return 500 on database error', async () => {
    mockGetPatients.mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost:3000/api/export/patients')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })
})
