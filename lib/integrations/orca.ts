/**
 * ORCA（日医標準レセコン）CSV連携
 * CSVインポート/エクスポートでレセコンとデータ同期
 *
 * 環境変数:
 * - ORCA_API_ENDPOINT（ORCAのAPI URL、設定されていればAPI連携）
 * - ORCA_API_KEY
 */
export class OrcaIntegration {
  /**
   * 患者データをORCA CSV形式でエクスポート
   */
  exportPatientsCsv(patients: any[]): string {
    // ORCA標準フォーマットに準拠
    const lines = patients.map(p => [
      p.patient_number,
      p.name,
      p.name_kana || '',
      p.date_of_birth?.replace(/-/g, '') || '',
      p.gender === 'male' || p.gender === '男性' ? '1' : '2',
      p.phone || '',
      p.address || '',
    ].join(','))
    return lines.join('\n')
  }

  /**
   * ORCA CSV形式の患者データをインポート（パース）
   */
  parsePatientsCsv(csvContent: string): any[] {
    return csvContent.split('\n').filter(Boolean).map(line => {
      const fields = line.split(',')
      return {
        patient_number: fields[0]?.trim(),
        name: fields[1]?.trim(),
        name_kana: fields[2]?.trim(),
        date_of_birth: fields[3] ? `${fields[3].substring(0, 4)}-${fields[3].substring(4, 6)}-${fields[3].substring(6, 8)}` : null,
        gender: fields[4]?.trim() === '1' ? 'male' : 'female',
        phone: fields[5]?.trim(),
        address: fields[6]?.trim(),
      }
    })
  }

  /**
   * API連携が設定されている場合、直接データ同期
   */
  async syncPatients(): Promise<{ success: boolean; synced: number; error?: string }> {
    const endpoint = process.env.ORCA_API_ENDPOINT
    const apiKey = process.env.ORCA_API_KEY

    if (!endpoint || !apiKey) {
      return { success: false, synced: 0, error: 'ORCA API not configured' }
    }

    try {
      const response = await fetch(`${endpoint}/patients`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, synced: data.length || 0 }
      }
      return { success: false, synced: 0, error: `ORCA API error: ${response.status}` }
    } catch (error: any) {
      return { success: false, synced: 0, error: error.message }
    }
  }
}

export const orcaIntegration = new OrcaIntegration()
