/**
 * 通知ディスパッチャー
 * テンプレート変数を展開してプロバイダーに送信する
 */
import { EmailProvider } from './email-provider'
import { SmsProvider } from './sms-provider'
import { LineProvider } from './line-provider'
import type { NotificationProvider, NotificationResult, NotificationParams } from './types'

export class NotificationDispatcher {
  private providers: Map<string, NotificationProvider>

  constructor() {
    this.providers = new Map()
    this.providers.set('email', new EmailProvider())
    this.providers.set('sms', new SmsProvider())
    this.providers.set('line', new LineProvider())
  }

  /**
   * テンプレート変数を展開
   * {{patient_name}} → 田中太郎 等
   */
  expandTemplate(template: string, data: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return result
  }

  /**
   * 指定チャネルで通知を送信
   */
  async send(
    channel: 'email' | 'sms' | 'line',
    params: NotificationParams
  ): Promise<NotificationResult> {
    const provider = this.providers.get(channel)
    if (!provider) {
      return { success: false, error: `Unknown channel: ${channel}` }
    }

    // テンプレート変数展開
    const expandedBody = params.templateData
      ? this.expandTemplate(params.body, params.templateData)
      : params.body

    const expandedSubject = params.subject && params.templateData
      ? this.expandTemplate(params.subject, params.templateData)
      : params.subject

    return provider.send({
      ...params,
      body: expandedBody,
      subject: expandedSubject,
    })
  }
}

// シングルトンインスタンス
export const notificationDispatcher = new NotificationDispatcher()
