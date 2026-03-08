"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** キャンセル待ちリストを取得する */
export async function getWaitlist() {
  try {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting waitlist:", error)
    return []
  }
}

/** キャンセル待ちに追加する */
export async function addToWaitlist(entry: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert({
        ...entry,
        clinic_id: CLINIC_ID,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error adding to waitlist:", error)
    return { success: false, error }
  }
}

/** キャンセル待ちから削除する */
export async function removeFromWaitlist(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("waitlist")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Error removing from waitlist:", error)
    return { success: false, error }
  }
}

/** キャンセル待ちエントリを更新する */
export async function updateWaitlistEntry(id: string, entry: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .update({
        ...entry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error updating waitlist entry:", error)
    return { success: false, error }
  }
}
