/**
 * CSV生成ユーティリティ
 * 予約一覧、患者一覧、レポートをCSV形式でエクスポート
 * BOM付きUTF-8でExcel対応
 */

/** CSV文字列を生成する（BOM付きUTF-8） */
export function generateCsv(headers: string[], rows: string[][]): string {
  const BOM = '\uFEFF'
  const headerLine = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
  const dataLines = rows.map(row =>
    row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
  )
  return BOM + [headerLine, ...dataLines].join('\n')
}

/** 予約一覧CSV */
export function generateAppointmentsCsv(appointments: any[]): string {
  const headers = ['予約ID', '日付', '開始時間', '終了時間', '患者名', '担当者', '治療内容', 'ステータス', 'チェア番号', '備考']
  const rows = appointments.map(a => [
    a.id, a.date, a.start_time, a.end_time,
    a.patient?.name || '', a.staff?.name || '',
    a.treatment_type || '', a.status, String(a.chair_number || ''), a.notes || ''
  ])
  return generateCsv(headers, rows)
}

/** 患者一覧CSV */
export function generatePatientsCsv(patients: any[]): string {
  const headers = ['患者番号', '氏名', 'フリガナ', '生年月日', '性別', '電話番号', 'メール', '住所', 'アレルギー']
  const rows = patients.map(p => [
    p.patient_number, p.name, p.name_kana || '', p.date_of_birth || '',
    p.gender || '', p.phone || '', p.email || '', p.address || '',
    Array.isArray(p.allergies) ? p.allergies.join('; ') : ''
  ])
  return generateCsv(headers, rows)
}

/** 売上レポートCSV */
export function generateRevenueCsv(data: any[]): string {
  const headers = ['日付', '予約数', '売上合計', '平均単価']
  const rows = data.map(d => [
    d.date, String(d.count), String(d.revenue), String(d.average)
  ])
  return generateCsv(headers, rows)
}
