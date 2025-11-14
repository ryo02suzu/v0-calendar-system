"use server"

import { CLINIC_ID } from "@/lib/constants"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Appointment } from "@/lib/types"

const appointmentSelect = `
  *,
  patients:patients!appointments_patient_id_fkey(*),
  staff:staff!appointments_staff_id_fkey(*)
`

export class AppointmentConflictError extends Error {
  constructor(message = "予約時間帯が重複しています") {
    super(message)
    this.name = "AppointmentConflictError"
  }
}

export class AppointmentNotFoundError extends Error {
  constructor(message = "予約が見つかりません") {
    super(message)
    this.name = "AppointmentNotFoundError"
  }
}

export type AppointmentInsertInput = {
  patient_id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  treatment_type: string
  status?: Appointment["status"]
  chair_number?: number | null
  notes?: string | null
}

export type AppointmentUpdateInput = Partial<AppointmentInsertInput>

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(appointmentSelect)
    .eq("clinic_id", CLINIC_ID)
    .eq("date", date)
    .order("start_time", { ascending: true })
    .order("staff_id", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching appointments by date:", error)
    throw error
  }

  return (data ?? []).map(formatAppointment)
}

export async function createAppointmentRecord(input: AppointmentInsertInput): Promise<Appointment> {
  await ensureNoConflict({ ...input })

  const timestamp = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      ...input,
      clinic_id: CLINIC_ID,
      status: input.status ?? "confirmed",
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select(appointmentSelect)
    .single()

  if (error) {
    console.error("[v0] Error creating appointment:", error)
    throw error
  }

  return formatAppointment(data)
}

export async function updateAppointmentRecord(
  id: string,
  updates: AppointmentUpdateInput,
): Promise<Appointment> {
  const current = await getAppointmentById(id)
  if (!current) {
    throw new AppointmentNotFoundError()
  }

  const merged = {
    patient_id: updates.patient_id ?? current.patient_id,
    staff_id: updates.staff_id ?? current.staff_id,
    date: updates.date ?? current.date,
    start_time: updates.start_time ?? current.start_time,
    end_time: updates.end_time ?? current.end_time,
  }

  if (
    updates.date !== undefined ||
    updates.start_time !== undefined ||
    updates.end_time !== undefined ||
    updates.staff_id !== undefined
  ) {
    await ensureNoConflict({ ...merged }, id)
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", CLINIC_ID)
    .select(appointmentSelect)
    .single()

  if (error) {
    console.error("[v0] Error updating appointment:", error)
    throw error
  }

  return formatAppointment(data)
}

export async function cancelAppointmentRecord(id: string): Promise<Appointment> {
  // Instead of physically deleting a record we mark it as cancelled so the
  // history stays auditable.
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", CLINIC_ID)
    .select(appointmentSelect)
    .single()

  if (error) {
    console.error("[v0] Error cancelling appointment:", error)
    throw error
  }

  if (!data) {
    throw new AppointmentNotFoundError()
  }

  return formatAppointment(data)
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(appointmentSelect)
    .eq("clinic_id", CLINIC_ID)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching appointment by id:", error)
    throw error
  }

  return data ? formatAppointment(data) : null
}

async function ensureNoConflict(
  {
    date,
    start_time,
    end_time,
    staff_id,
  }: {
    date: string
    start_time: string
    end_time: string
    staff_id: string
  },
  excludeId?: string,
) {
  const conflict = await checkAppointmentConflict(date, start_time, end_time, staff_id, excludeId)
  if (conflict) {
    throw new AppointmentConflictError()
  }
}

async function checkAppointmentConflict(
  date: string,
  startTime: string,
  endTime: string,
  staffId: string,
  excludeAppointmentId?: string,
): Promise<boolean> {
  let query = supabaseAdmin
    .from("appointments")
    .select("id,start_time,end_time")
    .eq("clinic_id", CLINIC_ID)
    .eq("date", date)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error checking appointment conflict:", error)
    throw error
  }

  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)

  return (data ?? []).some((appointment) => {
    const existingStart = timeToMinutes(appointment.start_time)
    const existingEnd = timeToMinutes(appointment.end_time)
    return newStart < existingEnd && newEnd > existingStart
  })
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10))
  return hours * 60 + minutes
}

function formatAppointment(raw: any): Appointment {
  const { patients, staff, ...rest } = raw
  return {
    ...rest,
    patient: patients ?? undefined,
    staff: staff ?? undefined,
  }
}
