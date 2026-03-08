"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** リマインダー設定を取得する */
export async function getReminderSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("reminder_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return {
        enabled: false,
        remind_hours_before: 24,
        send_sms: true,
        send_email: true,
        sms_template:
          "【{{clinic_name}}】\n{{patient_name}}様\n予約のお知らせです。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\n\nご来院をお待ちしております。",
        email_template:
          "{{patient_name}}様\n\nいつも{{clinic_name}}をご利用いただきありがとうございます。\n\nご予約のリマインダーをお送りします。\n\n【予約詳細】\n日時：{{date}} {{time}}\n担当：{{staff_name}}\nメニュー：{{service_name}}\n\n当日は予約時間の5分前までにお越しください。\nご変更やキャンセルの場合は、お早めにご連絡ください。\n\nよろしくお願いいたします。",
      }
    }

    return data
  } catch (error) {
    console.error("Error fetching reminder settings:", error)
    throw error
  }
}

/** リマインダー設定を更新する */
export async function updateReminderSettings(settings: any) {
  try {
    const existing = await supabaseAdmin
      .from("reminder_settings")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (existing.data) {
      const { data, error } = await supabaseAdmin
        .from("reminder_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("clinic_id", CLINIC_ID)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabaseAdmin
        .from("reminder_settings")
        .insert({
          ...settings,
          clinic_id: CLINIC_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error updating reminder settings:", error)
    throw error
  }
}

/**
 * リマインダー送信ログを取得する。
 * @param limit 取得件数（デフォルト20件）
 */
export async function getReminderLogs(limit: number = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reminder_logs")
      .select(`
        *,
        patients:patient_id(name)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching reminder logs:", error)
    return []
  }
}

/**
 * リマインダー送信結果をログに記録する。
 * 実際の送信処理は Phase 2 で実装予定。
 */
export async function sendReminder(params: {
  appointment_id: string
  patient_id: string
  method: "sms" | "email" | "line"
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reminder_logs")
      .insert({
        clinic_id: CLINIC_ID,
        appointment_id: params.appointment_id,
        patient_id: params.patient_id,
        method: params.method,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error sending reminder:", error)
    return { success: false, error }
  }
}
