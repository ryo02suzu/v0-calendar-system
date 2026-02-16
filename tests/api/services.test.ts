/**
 * Unit tests for /api/services endpoint
 * 
 * Tests cover:
 * - GET: Successful retrieval of active services
 * - GET: Filtering of inactive services
 * - POST: Successful creation of new service
 * - POST: Validation errors
 * - Database errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/services/route'

// Mock the database module
vi.mock('@/lib/db', () => ({
  getServices: vi.fn(),
  createService: vi.fn(),
}))

import { getServices, createService } from '@/lib/db'

const mockGetServices = getServices as ReturnType<typeof vi.fn>
const mockCreateService = createService as ReturnType<typeof vi.fn>

describe('GET /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return all active services', async () => {
    const mockServices = [
      {
        id: '1',
        name: '定期検診',
        description: '定期的な歯科検診',
        duration: 30,
        price: 3000,
        category: '予防歯科',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: '虫歯治療',
        description: '虫歯の治療',
        duration: 45,
        price: 5000,
        category: '一般歯科',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetServices.mockResolvedValue(mockServices)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].name).toBe('定期検診')
    expect(mockGetServices).toHaveBeenCalledOnce()
  })

  it('should filter out inactive services', async () => {
    const mockServices = [
      {
        id: '1',
        name: '定期検診',
        duration: 30,
        price: 3000,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: '廃止された治療',
        duration: 45,
        price: 5000,
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetServices.mockResolvedValue(mockServices)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].name).toBe('定期検診')
  })

  it('should handle database errors', async () => {
    mockGetServices.mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('サービス情報の取得に失敗しました')
  })
})

describe('POST /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should successfully create a new service', async () => {
    const newService = {
      name: '新しい治療',
      description: '新しい治療の説明',
      duration: 60,
      price: 10000,
      category: '審美歯科',
      is_active: true,
    }

    const mockCreatedService = {
      id: 'new-id',
      ...newService,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockCreateService.mockResolvedValue(mockCreatedService)

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      body: JSON.stringify(newService),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.id).toBe('new-id')
    expect(data.data.name).toBe('新しい治療')
    expect(mockCreateService).toHaveBeenCalledWith(newService)
  })

  it('should validate required fields', async () => {
    const invalidService = {
      name: '',
      duration: 0,
      price: -100,
    }

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      body: JSON.stringify(invalidService),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should handle database errors during creation', async () => {
    const newService = {
      name: '新しい治療',
      duration: 60,
      price: 10000,
    }

    mockCreateService.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      body: JSON.stringify(newService),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('サービスの登録に失敗しました')
  })
})
