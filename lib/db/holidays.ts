"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** 休診日一覧を取得する */
export async function getHolidays() {
  try {
    const { data, error } = await supabaseAdmin
      .from("holidays")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching holidays:", error)
    return []
  }
}

/** 休診日を追加する */
export async function createHoliday(holiday: any) {
  try {
    const { id, clinic_id, created_at, ...insertPayload } = holiday

    const { data, error } = await supabaseAdmin
      .from("holidays")
      .insert({
        ...insertPayload,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating holiday:", error)
    throw error
  }
}

/** 休診日を削除する */
export async function deleteHoliday(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("holidays")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting holiday:", error)
    throw error
  }
}
