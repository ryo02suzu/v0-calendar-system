/**
 * 通知送信プロバイダーの共通インターフェース
 * 各プロバイダー（SendGrid, Twilio, LINE等）はこのインターフェースを実装する
 */
export interface NotificationProvider {
  type: 'email' | 'sms' | 'line'
  send(params: NotificationParams): Promise<NotificationResult>
}

export interface NotificationParams {
  to: string        // メールアドレス、電話番号、LINE ID
  subject?: string  // メールの件名
  body: string      // 本文（テンプレート変数展開済み）
  templateData?: Record<string, string>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}
