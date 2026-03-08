/**
 * Google Calendar連携
 * 環境変数:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_CALENDAR_ID（同期先カレンダーID）
 *
 * 未設定時は何もしない（graceful degradation）
 */
export class GoogleCalendarSync {
  private accessToken: string | null = null

  isConfigured(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  }

  /**
   * アクセストークンを設定する
   */
  setAccessToken(token: string): void {
    this.accessToken = token
  }

  /**
   * 予約をGoogleカレンダーに追加
   */
  async createEvent(appointment: {
    date: string
    start_time: string
    end_time: string
    patientName: string
    staffName: string
    treatmentType: string
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[GOOGLE CALENDAR] Not configured, skipping sync')
      return { success: true }
    }

    if (!this.accessToken) {
      return { success: false, error: 'No access token configured' }
    }

    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: `${appointment.patientName} - ${appointment.treatmentType}`,
            description: `担当: ${appointment.staffName}`,
            start: {
              dateTime: `${appointment.date}T${appointment.start_time}:00`,
              timeZone: 'Asia/Tokyo',
            },
            end: {
              dateTime: `${appointment.date}T${appointment.end_time}:00`,
              timeZone: 'Asia/Tokyo',
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        return { success: true, eventId: data.id }
      }
      return { success: false, error: `Google Calendar error: ${response.status}` }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Googleカレンダーのイベントを削除（予約キャンセル時）
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !eventId) return { success: true }

    if (!this.accessToken) {
      return { success: false, error: 'No access token configured' }
    }

    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        }
      )
      return { success: response.ok }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const googleCalendarSync = new GoogleCalendarSync()
