"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"
import { mapPatientFromDb, mapPatientPayloadToDb } from "./utils"
import type { Patient } from "@/lib/types"

/** 患者一覧を取得する */
export async function getPatients(): Promise<Patient[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map(mapPatientFromDb)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return []
  }
}

/** 患者を作成する */
export async function createPatient(patient: Partial<Patient>) {
  try {
    const payload = mapPatientPayloadToDb(patient)

    const { data, error } = await supabaseAdmin
      .from("patients")
      .insert({
        ...payload,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return mapPatientFromDb(data)
  } catch (error) {
    console.error("Error creating patient:", error)
    throw error
  }
}

/** 患者情報を更新する */
export async function updatePatient(id: string, patient: Partial<Patient>) {
  try {
    const payload = mapPatientPayloadToDb(patient)

    const { data, error } = await supabaseAdmin
      .from("patients")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error

    return mapPatientFromDb(data)
  } catch (error) {
    console.error("Error updating patient:", error)
    throw error
  }
}

/** 患者を削除する */
export async function deletePatient(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting patient:", error)
    throw error
  }
}
