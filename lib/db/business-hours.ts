"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** 診療時間一覧を取得する */
export async function getBusinessHours() {
  try {
    const { data, error } = await supabaseAdmin
      .from("business_hours")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("day_of_week", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching business hours:", error)
    return []
  }
}

/**
 * 診療時間を更新する。
 * - 第1引数が文字列（ID）の場合は単一レコードを更新
 * - 第1引数が配列の場合は全件を DELETE → INSERT で置き換える
 */
export async function updateBusinessHours(hoursOrId: any[] | string, singleHour?: any) {
  try {
    if (typeof hoursOrId === "string" && singleHour) {
      const id = hoursOrId
      const { data, error } = await supabaseAdmin
        .from("business_hours")
        .update({
          ...singleHour,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("clinic_id", CLINIC_ID)
        .select()
        .single()

      if (error) throw error
      return data
    }

    const hours = hoursOrId as any[]

    // バックアップを取得してからDELETE→INSERTを実行
    const { data: backup, error: backupError } = await supabaseAdmin
      .from("business_hours")
      .select("*")
      .eq("clinic_id", CLINIC_ID)

    if (backupError) {
      console.error("Error backing up business hours:", backupError)
      throw backupError
    }

    const { error: deleteError } = await supabaseAdmin
      .from("business_hours")
      .delete()
      .eq("clinic_id", CLINIC_ID)

    if (deleteError) {
      console.error("Error deleting business hours:", deleteError)
      throw deleteError
    }

    const hoursWithClinic = hours.map((h) => ({
      ...h,
      clinic_id: CLINIC_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabaseAdmin
      .from("business_hours")
      .insert(hoursWithClinic)
      .select()

    if (error) {
      // INSERT失敗時、バックアップをリストア
      console.error("Error inserting business hours, restoring backup:", error)
      if (backup && backup.length > 0) {
        await supabaseAdmin.from("business_hours").insert(backup)
      }
      throw error
    }
    return data
  } catch (error) {
    console.error("Error updating business hours:", error)
    throw error
  }
}
