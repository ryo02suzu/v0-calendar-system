import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { CLINIC_ID } from "@/lib/db/client"
import { getReminderSettings } from "@/lib/db"
import { notificationDispatcher } from "@/lib/notifications/dispatcher"

/**
 * GET /api/cron/send-reminders
 *
 * Vercel Cron Jobs から毎時呼び出されるリマインダー処理エンドポイント。
 * - 設定された時間前（デフォルト24時間）の予約を検索
 * - まだリマインダーが送られていない予約を特定
 * - 通知ディスパッチャーを使って SMS/メールを送信
 * - reminder_logs テーブルにログを記録（success/failed）
 * - 環境変数未設定時はドライラン（ログ記録のみ、エラーにはしない）
 */
export async function GET(request: NextRequest) {
  // Vercel Cron の認証ヘッダーを検証
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await getReminderSettings()

    if (!settings.enabled) {
      return NextResponse.json({ message: "リマインダーは無効です", processed: 0 })
    }

    const remindHoursBefore = settings.remind_hours_before ?? 24
    const targetTime = new Date(Date.now() + remindHoursBefore * 60 * 60 * 1000)
    const targetDate = targetTime.toISOString().split("T")[0]
    const targetHour = targetTime.getHours().toString().padStart(2, "0")
    const targetMinute = targetTime.getMinutes().toString().padStart(2, "0")
    const targetTimeStr = `${targetHour}:${targetMinute}`

    // リマインダー対象の予約を取得（指定時刻前後30分の予約）
    // 注意: 日付をまたぐケース（00:00前後）は未対応
    const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000)
    const windowStartStr = `${windowStart.getHours().toString().padStart(2, "0")}:${windowStart.getMinutes().toString().padStart(2, "0")}`
    const windowEndStr = `${windowEnd.getHours().toString().padStart(2, "0")}:${windowEnd.getMinutes().toString().padStart(2, "0")}`

    const { data: appointments, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_id, start_time, date, patients(name, phone, email), staff(name), treatment_type")
      .eq("clinic_id", CLINIC_ID)
      .eq("date", targetDate)
      .gte("start_time", windowStartStr)
      .lte("start_time", windowEndStr)
      .neq("status", "cancelled")

    if (apptError) throw apptError

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "対象予約なし", processed: 0 })
    }

    // 既にリマインダーを送信済みの予約を除外
    const { data: existingLogs, error: logError } = await supabaseAdmin
      .from("reminder_logs")
      .select("appointment_id")
      .eq("clinic_id", CLINIC_ID)
      .in(
        "appointment_id",
        appointments.map((a) => a.id)
      )
      .in("status", ["sent", "pending"])

    if (logError) throw logError

    const sentAppointmentIds = new Set((existingLogs || []).map((l: any) => l.appointment_id))
    const toProcess = appointments.filter((a) => !sentAppointmentIds.has(a.id))

    if (toProcess.length === 0) {
      return NextResponse.json({ message: "送信済み予約のみ", processed: 0 })
    }

    // 各予約に対してメール/SMS を送信し、reminder_logs にログを記録
    let sentCount = 0
    const logsToInsert: any[] = []

    for (const apt of toProcess) {
      const patient = (apt as any).patients
      const staff = (apt as any).staff
      const templateData: Record<string, string> = {
        patient_name: patient?.name || '',
        date: apt.date,
        time: apt.start_time,
        staff_name: staff?.name || '',
        service_name: (apt as any).treatment_type || '',
        clinic_name: 'クリニック',
      }

      if (settings.send_sms && patient?.phone) {
        const result = await notificationDispatcher.send('sms', {
          to: patient.phone,
          body: settings.sms_template || '{{patient_name}}様、{{date}} {{time}}のご予約のリマインダーです。',
          templateData,
        })
        logsToInsert.push({
          clinic_id: CLINIC_ID,
          appointment_id: apt.id,
          patient_id: apt.patient_id,
          method: 'sms',
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          created_at: new Date().toISOString(),
        })
        if (result.success) sentCount++
      } else if (settings.send_sms) {
        logsToInsert.push({
          clinic_id: CLINIC_ID,
          appointment_id: apt.id,
          patient_id: apt.patient_id,
          method: 'sms',
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      }

      if (settings.send_email && patient?.email) {
        const result = await notificationDispatcher.send('email', {
          to: patient.email,
          subject: '予約リマインダー',
          body: settings.email_template || '{{patient_name}}様、{{date}} {{time}}のご予約のリマインダーです。',
          templateData,
        })
        logsToInsert.push({
          clinic_id: CLINIC_ID,
          appointment_id: apt.id,
          patient_id: apt.patient_id,
          method: 'email',
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          created_at: new Date().toISOString(),
        })
        if (result.success) sentCount++
      } else if (settings.send_email) {
        logsToInsert.push({
          clinic_id: CLINIC_ID,
          appointment_id: apt.id,
          patient_id: apt.patient_id,
          method: 'email',
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      }
    }

    if (logsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("reminder_logs")
        .insert(logsToInsert)

      if (insertError) throw insertError
    }

    console.log(`[cron] Processed ${toProcess.length} appointments, sent ${sentCount} notifications`)

    return NextResponse.json({
      message: "リマインダーを送信しました",
      processed: toProcess.length,
      queued: logsToInsert.length,
      sent: sentCount,
    })
  } catch (error) {
    console.error("[cron/send-reminders] Error:", error)
    return NextResponse.json(
      { error: "リマインダー処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
