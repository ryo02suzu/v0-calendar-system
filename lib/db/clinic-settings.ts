"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** クリニック設定を取得する（存在しない場合はデフォルト値を作成） */
export async function getClinicSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinic_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        const { data: newData, error: createError } = await supabaseAdmin
          .from("clinic_settings")
          .insert({
            clinic_id: CLINIC_ID,
            chairs_count: 3,
            booking_advance_days: 60,
            booking_buffer_minutes: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) throw createError
        return newData
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching clinic settings:", error)
    return null
  }
}

/** クリニック設定を更新する */
export async function updateClinicSettings(settings: any) {
  try {
    const { id, clinic_id, created_at, updated_at, ...updatePayload } = settings

    const { data, error } = await supabaseAdmin
      .from("clinic_settings")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating clinic settings:", error)
    throw error
  }
}

/** クリニック情報を取得する */
export async function getClinic() {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("id", CLINIC_ID)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching clinic:", error)
    return null
  }
}

/** クリニック情報を更新する */
export async function updateClinic(clinic: any) {
  try {
    const { id, created_at, updated_at, ...updatePayload } = clinic

    const { data, error } = await supabaseAdmin
      .from("clinics")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating clinic:", error)
    throw error
  }
}
