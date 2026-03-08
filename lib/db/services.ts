"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"
import type { Service } from "@/lib/types"

/** 診療メニュー一覧を取得する */
export async function getServices() {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

/** 診療メニューを作成する */
export async function createService(service: Partial<Service>) {
  try {
    const { id, clinic_id, created_at, updated_at, ...insertPayload } = service

    const { data, error } = await supabaseAdmin
      .from("services")
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
    console.error("Error creating service:", error)
    throw error
  }
}

/** 診療メニューを更新する */
export async function updateService(id: string, service: Partial<Service>) {
  try {
    const { id: _id, clinic_id, created_at, updated_at, ...updatePayload } = service

    const { data, error } = await supabaseAdmin
      .from("services")
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
    console.error("Error updating service:", error)
    throw error
  }
}

/** 診療メニューを削除する */
export async function deleteService(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}
