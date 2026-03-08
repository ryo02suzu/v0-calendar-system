/**
 * Unit tests for lib/export/pdf-generator.ts
 */

import { describe, it, expect } from 'vitest'
import {
  generatePdfHtml,
  generateAppointmentsPdfHtml,
  generatePatientsPdfHtml,
} from '@/lib/export/pdf-generator'

describe('generatePdfHtml', () => {
  it('should produce valid HTML with title', () => {
    const html = generatePdfHtml('テストタイトル', '<p>本文</p>')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>テストタイトル</title>')
    expect(html).toContain('<h1>テストタイトル</h1>')
    expect(html).toContain('<p>本文</p>')
  })

  it('should include clinic name when provided', () => {
    const html = generatePdfHtml('タイトル', '<p>内容</p>', 'テストクリニック')
    expect(html).toContain('テストクリニック')
  })

  it('should include current date', () => {
    const html = generatePdfHtml('タイトル', '')
    const year = new Date().getFullYear().toString()
    expect(html).toContain(year)
  })

  it('should include Japanese font family', () => {
    const html = generatePdfHtml('タイトル', '')
    expect(html).toContain('Hiragino Kaku Gothic ProN')
  })
})

describe('generateAppointmentsPdfHtml', () => {
  it('should include table headers', () => {
    const html = generateAppointmentsPdfHtml([])
    expect(html).toContain('日付')
    expect(html).toContain('時間')
    expect(html).toContain('患者名')
    expect(html).toContain('担当者')
    expect(html).toContain('治療内容')
    expect(html).toContain('ステータス')
  })

  it('should include appointment data in table rows', () => {
    const appointments = [
      {
        date: '2026-03-08',
        start_time: '10:00',
        end_time: '10:30',
        patient: { name: '田中太郎' },
        staff: { name: '山田医師' },
        treatment_type: '定期検診',
        status: 'confirmed',
      },
    ]
    const html = generateAppointmentsPdfHtml(appointments, 'テストクリニック')
    expect(html).toContain('2026-03-08')
    expect(html).toContain('10:00-10:30')
    expect(html).toContain('田中太郎')
    expect(html).toContain('山田医師')
    expect(html).toContain('定期検診')
    expect(html).toContain('confirmed')
  })
})

describe('generatePatientsPdfHtml', () => {
  it('should include table headers', () => {
    const html = generatePatientsPdfHtml([])
    expect(html).toContain('患者番号')
    expect(html).toContain('氏名')
    expect(html).toContain('電話番号')
    expect(html).toContain('メール')
    expect(html).toContain('生年月日')
  })

  it('should include patient data in table rows', () => {
    const patients = [
      {
        patient_number: 'P001',
        name: '鈴木花子',
        phone: '090-1234-5678',
        email: 'hanako@example.com',
        date_of_birth: '1990-01-01',
      },
    ]
    const html = generatePatientsPdfHtml(patients)
    expect(html).toContain('P001')
    expect(html).toContain('鈴木花子')
    expect(html).toContain('090-1234-5678')
  })
})
