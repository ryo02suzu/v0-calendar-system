/**
 * Unit tests for lib/export/csv-generator.ts
 */

import { describe, it, expect } from 'vitest'
import {
  generateCsv,
  generateAppointmentsCsv,
  generatePatientsCsv,
  generateRevenueCsv,
} from '@/lib/export/csv-generator'

describe('generateCsv', () => {
  it('should start with BOM character', () => {
    const csv = generateCsv(['Col1'], [['Val1']])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('should quote all fields', () => {
    const csv = generateCsv(['Header'], [['Value']])
    expect(csv).toContain('"Header"')
    expect(csv).toContain('"Value"')
  })

  it('should escape double quotes in fields', () => {
    const csv = generateCsv(['Col "A"'], [['Val "B"']])
    expect(csv).toContain('"Col ""A"""')
    expect(csv).toContain('"Val ""B"""')
  })

  it('should handle empty cells', () => {
    const csv = generateCsv(['A', 'B'], [['', undefined as any]])
    expect(csv).toContain('"",""')
  })

  it('should separate rows with newlines', () => {
    const csv = generateCsv(['H1'], [['R1'], ['R2']])
    const lines = csv.slice(1).split('\n') // skip BOM
    expect(lines).toHaveLength(3) // header + 2 rows
  })
})

describe('generateAppointmentsCsv', () => {
  it('should include all required headers', () => {
    const csv = generateAppointmentsCsv([])
    expect(csv).toContain('予約ID')
    expect(csv).toContain('患者名')
    expect(csv).toContain('担当者')
    expect(csv).toContain('ステータス')
  })

  it('should export appointment data', () => {
    const appointments = [
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
        notes: '特記なし',
      },
    ]
    const csv = generateAppointmentsCsv(appointments)
    expect(csv).toContain('apt-1')
    expect(csv).toContain('田中太郎')
    expect(csv).toContain('山田医師')
    expect(csv).toContain('定期検診')
  })
})

describe('generatePatientsCsv', () => {
  it('should include all required headers', () => {
    const csv = generatePatientsCsv([])
    expect(csv).toContain('患者番号')
    expect(csv).toContain('氏名')
    expect(csv).toContain('電話番号')
  })

  it('should join allergies with semicolons', () => {
    const patients = [
      {
        patient_number: 'P001',
        name: '鈴木花子',
        allergies: ['ペニシリン', 'アスピリン'],
      },
    ]
    const csv = generatePatientsCsv(patients)
    expect(csv).toContain('ペニシリン; アスピリン')
  })

  it('should handle non-array allergies gracefully', () => {
    const patients = [
      { patient_number: 'P002', name: 'テスト', allergies: null },
    ]
    const csv = generatePatientsCsv(patients)
    expect(csv).toContain('P002')
  })
})

describe('generateRevenueCsv', () => {
  it('should include all required headers', () => {
    const csv = generateRevenueCsv([])
    expect(csv).toContain('日付')
    expect(csv).toContain('予約数')
    expect(csv).toContain('売上合計')
    expect(csv).toContain('平均単価')
  })

  it('should export revenue data', () => {
    const data = [
      { date: '2026-03-08', count: 5, revenue: 15000, average: 3000 },
    ]
    const csv = generateRevenueCsv(data)
    expect(csv).toContain('2026-03-08')
    expect(csv).toContain('15000')
  })
})
