"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"
import { mapPatientFromDb } from "./utils"
import { getClinicSettings } from "./clinic-settings"

/** 予約一覧を取得する */
export async function getAppointments() {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) throw error

    const formattedData = (data || []).map((apt) => ({
      ...apt,
      patient: apt.patient ? mapPatientFromDb(apt.patient) : undefined,
    }))

    return formattedData
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return []
  }
}

/** 予約を作成する */
export async function createAppointment(appointment: any) {
  try {
    const { patient, staff, service, ...insertPayload } = appointment

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        ...insertPayload,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .single()

    if (error) throw error

    const formattedData = {
      ...data,
      patient: data.patient ? mapPatientFromDb(data.patient) : undefined,
    }

    return formattedData
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

/** 予約を更新する */
export async function updateAppointment(id: string, appointment: any) {
  try {
    const { patient, staff, service, ...updatePayload } = appointment

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .single()

    if (error) throw error

    const formattedData = {
      ...data,
      patient: data.patient ? mapPatientFromDb(data.patient) : undefined,
    }

    return formattedData
  } catch (error) {
    console.error("Error updating appointment:", error)
    throw error
  }
}

/** 予約を削除する */
export async function deleteAppointment(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting appointment:", error)
    throw error
  }
}

/** スタッフ・チェアのダブルブッキングをチェックする */
export async function checkAppointmentConflict(
  date: string,
  startTime: string,
  endTime: string,
  staffId: string,
  chairNumber?: number,
  excludeId?: string,
) {
  try {
    const settings = await getClinicSettings()

    const { data: staffData } = await supabaseAdmin
      .from("staff")
      .select("max_concurrent_appointments")
      .eq("id", staffId)
      .single()

    const staffCapacity = staffData?.max_concurrent_appointments ?? settings?.max_concurrent_appointments ?? 1

    let staffQuery = supabaseAdmin
      .from("appointments")
      .select("id, start_time, end_time, chair_number")
      .eq("clinic_id", CLINIC_ID)
      .eq("date", date)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")

    if (excludeId) {
      staffQuery = staffQuery.neq("id", excludeId)
    }

    const { data: staffAppointments, error: staffError } = await staffQuery
    if (staffError) throw staffError

    const staffOverlapCount =
      staffAppointments?.filter((apt) => {
        return startTime < apt.end_time && endTime > apt.start_time
      }).length || 0

    let chairOverlapCount = 0
    if (chairNumber) {
      const chairConflicts =
        staffAppointments?.filter((apt) => {
          return apt.chair_number === chairNumber && startTime < apt.end_time && endTime > apt.start_time
        }) || []
      chairOverlapCount = chairConflicts.length
    }

    const canBook = chairOverlapCount === 0 && staffOverlapCount < staffCapacity

    return {
      canBook,
      staffOverlapCount,
      chairOverlapCount,
      staffCapacity,
      remainingCapacity: Math.max(0, staffCapacity - staffOverlapCount),
      message: !canBook
        ? chairOverlapCount > 0
          ? `チェア${chairNumber}は既に使用中です。別のチェアを選択してください。`
          : `この時間帯はスタッフの上限（${staffCapacity}件）に達しています。`
        : undefined,
    }
  } catch (error) {
    console.error("[v0] checkAppointmentConflict error:", error)
    return {
      canBook: false,
      staffOverlapCount: 0,
      chairOverlapCount: 0,
      staffCapacity: 1,
      remainingCapacity: 0,
      message: "予約の確認中にエラーが発生しました",
    }
  }
}

/** 今日の予約を取得する */
export async function getTodayAppointments() {
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .eq("date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting today's appointments:", error)
    return []
  }
}

/** 日付範囲で予約を取得する */
export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting appointments by date range:", error)
    return []
  }
}

/** 患者のリスクスコアを計算する */
export async function getPatientRiskScore(patientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("status")
      .eq("clinic_id", CLINIC_ID)
      .eq("patient_id", patientId)

    if (error) throw error

    const cancellationCount = data?.filter((apt) => apt.status === "cancelled").length || 0
    const noShowCount = data?.filter((apt) => apt.status === "no_show").length || 0
    const totalAppointments = data?.length || 0

    let riskScore = 0
    if (totalAppointments > 0) {
      const cancellationRate = cancellationCount / totalAppointments
      const noShowRate = noShowCount / totalAppointments
      riskScore = Math.round(cancellationRate * 50 + noShowRate * 100)
    }

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high",
      cancellationCount,
      noShowCount,
      totalAppointments,
    }
  } catch (error) {
    console.error("[v0] Error calculating risk score:", error)
    return {
      riskScore: 0,
      riskLevel: "low" as const,
      cancellationCount: 0,
      noShowCount: 0,
      totalAppointments: 0,
    }
  }
}
