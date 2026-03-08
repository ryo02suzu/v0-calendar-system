"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"
import type { Staff } from "@/lib/types"

/** スタッフ一覧を取得する */
export async function getStaff() {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

/** スタッフを作成する */
export async function createStaff(staff: Partial<Staff>) {
  try {
    const { id, clinic_id, created_at, updated_at, ...insertPayload } = staff

    const { data, error } = await supabaseAdmin
      .from("staff")
      .insert({
        ...insertPayload,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating staff:", error)
    throw error
  }
}

/** スタッフ情報を更新する */
export async function updateStaff(id: string, staff: Partial<Staff>) {
  try {
    const { id: _id, clinic_id, created_at, updated_at, ...updatePayload } = staff

    const { data, error } = await supabaseAdmin
      .from("staff")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating staff:", error)
    throw error
  }
}

/** スタッフを削除する */
export async function deleteStaff(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("staff")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting staff:", error)
    throw error
  }
}
