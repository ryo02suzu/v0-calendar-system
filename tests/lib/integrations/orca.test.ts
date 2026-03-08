/**
 * Unit tests for lib/integrations/orca.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrcaIntegration } from '@/lib/integrations/orca'

describe('OrcaIntegration', () => {
  let orca: OrcaIntegration

  beforeEach(() => {
    orca = new OrcaIntegration()
    delete process.env.ORCA_API_ENDPOINT
    delete process.env.ORCA_API_KEY
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportPatientsCsv', () => {
    it('should export patients in ORCA CSV format', () => {
      const patients = [
        {
          patient_number: 'P001',
          name: '田中太郎',
          name_kana: 'タナカタロウ',
          date_of_birth: '1980-05-15',
          gender: 'male',
          phone: '090-1234-5678',
          address: '東京都渋谷区',
        },
      ]
      const csv = orca.exportPatientsCsv(patients)
      expect(csv).toContain('P001')
      expect(csv).toContain('田中太郎')
      expect(csv).toContain('タナカタロウ')
      expect(csv).toContain('19800515')
      expect(csv).toContain('1') // male
      expect(csv).toContain('090-1234-5678')
    })

    it('should use gender code 2 for female patients', () => {
      const patients = [
        { patient_number: 'P002', name: '鈴木花子', gender: 'female' },
      ]
      const csv = orca.exportPatientsCsv(patients)
      const fields = csv.split(',')
      expect(fields[4]).toBe('2')
    })

    it('should handle missing optional fields', () => {
      const patients = [{ patient_number: 'P003', name: 'テスト' }]
      const csv = orca.exportPatientsCsv(patients)
      expect(csv).toContain('P003')
    })
  })

  describe('parsePatientsCsv', () => {
    it('should parse ORCA CSV format', () => {
      const csv = 'P001,田中太郎,タナカタロウ,19800515,1,090-1234-5678,東京都渋谷区'
      const patients = orca.parsePatientsCsv(csv)

      expect(patients).toHaveLength(1)
      expect(patients[0].patient_number).toBe('P001')
      expect(patients[0].name).toBe('田中太郎')
      expect(patients[0].name_kana).toBe('タナカタロウ')
      expect(patients[0].date_of_birth).toBe('1980-05-15')
      expect(patients[0].gender).toBe('male')
      expect(patients[0].phone).toBe('090-1234-5678')
      expect(patients[0].address).toBe('東京都渋谷区')
    })

    it('should parse female gender code', () => {
      const csv = 'P002,鈴木花子,スズキハナコ,19920822,2,080-9876-5432,'
      const patients = orca.parsePatientsCsv(csv)
      expect(patients[0].gender).toBe('female')
    })

    it('should parse multiple lines', () => {
      const csv = 'P001,患者A,,,,, \nP002,患者B,,,,,'
      const patients = orca.parsePatientsCsv(csv)
      expect(patients).toHaveLength(2)
    })

    it('should ignore empty lines', () => {
      const csv = 'P001,患者A,,,,,\n\nP002,患者B,,,,,'
      const patients = orca.parsePatientsCsv(csv)
      expect(patients).toHaveLength(2)
    })
  })

  describe('syncPatients', () => {
    it('should return error when ORCA API is not configured', async () => {
      const result = await orca.syncPatients()
      expect(result.success).toBe(false)
      expect(result.error).toBe('ORCA API not configured')
      expect(result.synced).toBe(0)
    })

    it('should call ORCA API when configured', async () => {
      process.env.ORCA_API_ENDPOINT = 'http://localhost:8000'
      process.env.ORCA_API_KEY = 'test-key'

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }],
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await orca.syncPatients()
      expect(result.success).toBe(true)
      expect(result.synced).toBe(2)
    })

    it('should return error on ORCA API failure', async () => {
      process.env.ORCA_API_ENDPOINT = 'http://localhost:8000'
      process.env.ORCA_API_KEY = 'test-key'

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await orca.syncPatients()
      expect(result.success).toBe(false)
      expect(result.error).toContain('ORCA API error')
    })
  })
})
