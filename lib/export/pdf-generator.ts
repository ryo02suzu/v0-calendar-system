/**
 * PDF生成ユーティリティ
 * HTML → PDF変換（サーバーサイド）
 * 軽量実装: HTML文字列を生成し、ブラウザのprint機能またはサーバーサイドで変換
 */

/** 印刷用HTMLページを生成する */
export function generatePdfHtml(title: string, content: string, clinicName?: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif; margin: 40px; }
    h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
    th { background: #f5f5f5; font-weight: bold; }
    .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .clinic-name { font-size: 14px; color: #666; }
    .date { font-size: 12px; color: #999; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">${clinicName || ''}</div>
    <div class="date">${new Date().toLocaleDateString('ja-JP')}</div>
  </div>
  <h1>${title}</h1>
  ${content}
</body>
</html>
  `.trim()
}

/** 予約一覧PDF用HTML */
export function generateAppointmentsPdfHtml(appointments: any[], clinicName?: string): string {
  const rows = appointments.map(a => `
    <tr>
      <td>${a.date}</td>
      <td>${a.start_time}-${a.end_time}</td>
      <td>${a.patient?.name || ''}</td>
      <td>${a.staff?.name || ''}</td>
      <td>${a.treatment_type || ''}</td>
      <td>${a.status}</td>
    </tr>
  `).join('')

  const content = `
    <table>
      <thead><tr><th>日付</th><th>時間</th><th>患者名</th><th>担当者</th><th>治療内容</th><th>ステータス</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `

  return generatePdfHtml('予約一覧', content, clinicName)
}

/** 患者一覧PDF用HTML */
export function generatePatientsPdfHtml(patients: any[], clinicName?: string): string {
  const rows = patients.map(p => `
    <tr>
      <td>${p.patient_number}</td>
      <td>${p.name}</td>
      <td>${p.phone || ''}</td>
      <td>${p.email || ''}</td>
      <td>${p.date_of_birth || ''}</td>
    </tr>
  `).join('')

  const content = `
    <table>
      <thead><tr><th>患者番号</th><th>氏名</th><th>電話番号</th><th>メール</th><th>生年月日</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `

  return generatePdfHtml('患者一覧', content, clinicName)
}
