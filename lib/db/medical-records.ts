"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"
import type { MedicalRecord } from "@/lib/types"

/** カルテ一覧を取得する（患者IDで絞り込み可能） */
export async function getMedicalRecords(patientId?: string) {
  try {
    let query = supabaseAdmin
      .from("medical_records")
      .select(`
        *,
        staff:staff(*),
        patients:patients(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: false })

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching medical records:", error)
      throw error
    }

    const formattedData =
      data?.map((record) => {
        const { patients, ...rest } = record
        return {
          ...rest,
          staff: record.staff,
          patient: patients,
        }
      }) || []

    return formattedData
  } catch (error) {
    console.error("Error fetching medical records:", error)
    return []
  }
}

/** カルテを作成する */
export async function createMedicalRecord(record: Partial<MedicalRecord>) {
  try {
    const { id, clinic_id, created_at, updated_at, staff, patient, ...insertPayload } = record

    const { data, error } = await supabaseAdmin
      .from("medical_records")
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
    console.error("Error creating medical record:", error)
    throw error
  }
}
