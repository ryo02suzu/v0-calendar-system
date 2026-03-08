/**
 * SMS送信プロバイダー
 * 環境変数:
 * - SMS_PROVIDER: 'twilio' | 'vonage' (デフォルト: 'twilio')
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *
 * 環境変数未設定時はドライラン（ログ出力のみ）
 */
import type { NotificationProvider, NotificationParams, NotificationResult } from './types'

export class SmsProvider implements NotificationProvider {
  type = 'sms' as const

  async send(params: NotificationParams): Promise<NotificationResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER

    if (!sid || !token || !from) {
      console.log(`[SMS DRY RUN] To: ${params.to}, Body: ${params.body.substring(0, 100)}...`)
      return { success: true, messageId: `dry-run-sms-${Date.now()}` }
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: params.to,
            From: from,
            Body: params.body,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        return { success: true, messageId: data.sid }
      }
      const errorBody = await response.text()
      return { success: false, error: `Twilio error: ${response.status} ${errorBody}` }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
