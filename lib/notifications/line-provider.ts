/**
 * LINE Messaging API プロバイダー
 * 環境変数:
 * - LINE_CHANNEL_ACCESS_TOKEN
 *
 * 未設定時はドライラン
 */
import type { NotificationProvider, NotificationParams, NotificationResult } from './types'

export class LineProvider implements NotificationProvider {
  type = 'line' as const

  async send(params: NotificationParams): Promise<NotificationResult> {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN

    if (!token) {
      console.log(`[LINE DRY RUN] To: ${params.to}, Body: ${params.body.substring(0, 100)}...`)
      return { success: true, messageId: `dry-run-line-${Date.now()}` }
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          messages: [{ type: 'text', text: params.body }],
        }),
      })

      if (response.ok) {
        return { success: true, messageId: `line-${Date.now()}` }
      }
      const errorBody = await response.text()
      return { success: false, error: `LINE error: ${response.status} ${errorBody}` }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
