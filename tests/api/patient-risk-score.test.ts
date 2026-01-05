/**
 * Unit tests for /api/patients/[id]/risk-score endpoint
 * 
 * Tests cover:
 * - Successful risk score retrieval
 * - Missing environment variables
 * - Invalid environment variables (malformed URL)
 * - Database errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/patients/[id]/risk-score/route'

// Mock the database module
vi.mock('@/lib/db', () => ({
  getPatientRiskScore: vi.fn(),
}))

import { getPatientRiskScore } from '@/lib/db'

const mockGetPatientRiskScore = getPatientRiskScore as ReturnType<typeof vi.fn>

describe('GET /api/patients/[id]/risk-score', () => {
  const originalEnv = { ...process.env }

  const createRequest = () => {
    return new NextRequest('http://localhost:3000/api/patients/123/risk-score', {
      method: 'GET',
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables to valid values
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('Successful risk score retrieval', () => {
    it('should successfully return patient risk score', async () => {
      const mockRiskScore = {
        riskScore: 25,
        riskLevel: 'low',
        cancellationCount: 1,
        noShowCount: 0,
        totalAppointments: 10,
      }

      mockGetPatientRiskScore.mockResolvedValue(mockRiskScore)

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockRiskScore)
      expect(mockGetPatientRiskScore).toHaveBeenCalledWith('patient-123')
    })
  })

  describe('Environment variable validation', () => {
    it('should return 503 when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
      expect(data).toHaveProperty('details')
      expect(mockGetPatientRiskScore).not.toHaveBeenCalled()
    })

    it('should return 503 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
      expect(data).toHaveProperty('details')
      expect(mockGetPatientRiskScore).not.toHaveBeenCalled()
    })

    it('should return 503 when NEXT_PUBLIC_SUPABASE_URL is empty', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
    })

    it('should return 503 when NEXT_PUBLIC_SUPABASE_URL is only whitespace', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '   '

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
    })

    it('should return 503 when NEXT_PUBLIC_SUPABASE_URL is invalid (contains spaces)', async () => {
      // This is the specific error mentioned in the problem statement
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pfsxoyvbuclbtrowjfln. supabase.co'

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
      expect(data).toHaveProperty('details', 'Invalid Supabase URL configuration')
      expect(console.error).toHaveBeenCalled()
    })

    it('should return 503 when NEXT_PUBLIC_SUPABASE_URL is malformed', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
      expect(data).toHaveProperty('details', 'Invalid Supabase URL configuration')
    })

    it('should trim whitespace from environment variables', async () => {
      // Environment variables with leading/trailing whitespace should be handled
      process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://test-project.supabase.co  '
      process.env.SUPABASE_SERVICE_ROLE_KEY = '  test-service-role-key  '

      const mockRiskScore = {
        riskScore: 0,
        riskLevel: 'low',
        cancellationCount: 0,
        noShowCount: 0,
        totalAppointments: 5,
      }
      mockGetPatientRiskScore.mockResolvedValue(mockRiskScore)

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      // Should succeed because whitespace is trimmed
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockRiskScore)
    })
  })

  describe('Database errors', () => {
    it('should return 500 when database operation fails', async () => {
      const dbError = new Error('Database connection failed')
      mockGetPatientRiskScore.mockRejectedValue(dbError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Failed to get risk score')
      expect(console.error).toHaveBeenCalledWith(
        'Error getting patient risk score:',
        dbError
      )
    })

    it('should return 503 when error is related to environment configuration', async () => {
      const envError = new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL')
      mockGetPatientRiskScore.mockRejectedValue(envError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Service configuration error')
      expect(data).toHaveProperty('details', 'Database connection not properly configured')
    })
  })

  describe('Edge cases', () => {
    it('should handle various patient ID formats', async () => {
      const patientIds = ['123', 'patient-uuid-123', '00000000-0000-0000-0000-000000000031']

      for (const id of patientIds) {
        mockGetPatientRiskScore.mockResolvedValue({
          riskScore: 0,
          riskLevel: 'low',
          cancellationCount: 0,
          noShowCount: 0,
          totalAppointments: 0,
        })

        const request = createRequest()
        const params = Promise.resolve({ id })
        const response = await GET(request, { params })

        expect(response.status).toBe(200)
        expect(mockGetPatientRiskScore).toHaveBeenCalledWith(id)
      }
    })

    it('should not expose sensitive error details to client', async () => {
      const sensitiveError = new Error('Database password incorrect: pw=secret123')
      mockGetPatientRiskScore.mockRejectedValue(sensitiveError)

      const request = createRequest()
      const params = Promise.resolve({ id: 'patient-123' })
      const response = await GET(request, { params })

      const data = await response.json()
      // Should return generic error message
      expect(data.error).toBe('Failed to get risk score')
      // Should not include sensitive details
      expect(JSON.stringify(data)).not.toContain('secret123')
      expect(JSON.stringify(data)).not.toContain('password')
    })
  })
})
