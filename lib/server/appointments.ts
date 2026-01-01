import { CLINIC_ID } from "@/lib/constants"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Appointment } from "@/lib/types"
import type { ReservationResponse } from "@/types/api"
import { 
  validateAppointment, 
  AppointmentValidationError,
  type ValidationResult 
} from "@/lib/validations/appointment-validation"
import {
  executeInTransaction,
  executeDatabaseOperation,
  executeCalendarOperation,
  executeSpreadsheetOperation,
  executeNotificationOperation,
  getIntegrationConfig,
  type TransactionContext,
} from "@/lib/transactions/appointment-transaction"

// NOTE: This file intentionally does not use the "use server" directive even though it
// only exports server-side utilities. Route Handlers import the error classes defined
// below, and the directive would force Next.js to treat this as a Server Action module
// where only async functions may be exported, leading to build-time failures.

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
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })
    .order("staff_id", { ascending: true })

  if (error) {
    console.error("Error fetching appointments by date:", error)
    throw error
  }

  return (data ?? []).map(formatAppointment)
}

export async function createAppointmentRecord(input: AppointmentInsertInput): Promise<Appointment> {
  // Comprehensive validation including business hours, holidays, and capacity
  const validationResult = await validateAppointment({
    clinicId: CLINIC_ID,
    date: input.date,
    startTime: input.start_time,
    endTime: input.end_time,
    staffId: input.staff_id,
    chairNumber: input.chair_number,
  })

  if (!validationResult.valid) {
    throw new AppointmentValidationError(validationResult)
  }

  // Execute within transaction to ensure consistency across all systems
  const txResult = await executeInTransaction(async (context: TransactionContext) => {
    const timestamp = new Date().toISOString()
    
    // Database operation
    const appointment = await executeDatabaseOperation(
      context,
      "insert",
      async () => {
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
          console.error("Error creating appointment:", error)
          throw error
        }

        return formatAppointment(data)
      }
    )

    // Calendar integration (if configured)
    await executeCalendarOperation(
      context,
      "create",
      async () => {
        const config = getIntegrationConfig()
        if (config.calendar) {
          return await config.calendar.createEvent(appointment)
        }
        return {}
      }
    )

    // Spreadsheet integration (if configured)
    await executeSpreadsheetOperation(
      context,
      "create",
      async () => {
        const config = getIntegrationConfig()
        if (config.spreadsheet) {
          return await config.spreadsheet.addRow(appointment)
        }
        return {}
      }
    )

    // Notification integration (if configured)
    await executeNotificationOperation(
      context,
      "sendAppointmentCreated",
      async () => {
        const config = getIntegrationConfig()
        if (config.notification) {
          return await config.notification.sendAppointmentCreated(appointment)
        }
        return {}
      }
    )

    return appointment
  })

  if (!txResult.success) {
    console.error("Transaction failed:", txResult.errors)
    throw txResult.errors[0] || new Error("予約の作成に失敗しました")
  }

  return txResult.data!
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
    treatment_type: updates.treatment_type ?? current.treatment_type,
    status: updates.status ?? current.status,
    chair_number: updates.chair_number ?? current.chair_number,
    notes: updates.notes ?? current.notes,
  }

  // Validate the merged data if time/date/staff changed
  const needsValidation = 
    updates.date !== undefined ||
    updates.start_time !== undefined ||
    updates.end_time !== undefined ||
    updates.staff_id !== undefined

  if (needsValidation) {
    const validationResult = await validateAppointment({
      clinicId: CLINIC_ID,
      date: merged.date,
      startTime: merged.start_time,
      endTime: merged.end_time,
      staffId: merged.staff_id,
      chairNumber: merged.chair_number,
      excludeAppointmentId: id,
    })

    if (!validationResult.valid) {
      throw new AppointmentValidationError(validationResult)
    }
  }

  // Execute within transaction
  const txResult = await executeInTransaction(async (context: TransactionContext) => {
    const timestamp = new Date().toISOString()
    
    // Store original for rollback
    const originalData = { ...current }
    
    // Database operation
    const appointment = await executeDatabaseOperation(
      context,
      "update",
      async () => {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .update({
            ...merged,
            updated_at: timestamp,
          })
          .eq("id", id)
          .eq("clinic_id", CLINIC_ID)
          .select(appointmentSelect)
          .single()

        if (error) {
          console.error("updateAppointmentRecord failed:", error)
          throw error
        }

        return formatAppointment(data)
      },
      originalData
    )

    // Calendar integration
    await executeCalendarOperation(
      context,
      "update",
      async () => {
        const config = getIntegrationConfig()
        if (config.calendar) {
          // Assuming calendar event ID is stored somewhere
          // For now, we'll just call update with appointment data
          return await config.calendar.updateEvent(id, appointment)
        }
        return {}
      },
      originalData
    )

    // Spreadsheet integration
    await executeSpreadsheetOperation(
      context,
      "update",
      async () => {
        const config = getIntegrationConfig()
        if (config.spreadsheet) {
          return await config.spreadsheet.updateRow(id, appointment)
        }
        return {}
      },
      originalData
    )

    // Notification integration
    await executeNotificationOperation(
      context,
      "sendAppointmentUpdated",
      async () => {
        const config = getIntegrationConfig()
        if (config.notification) {
          return await config.notification.sendAppointmentUpdated(current, appointment)
        }
        return {}
      }
    )

    return appointment
  })

  if (!txResult.success) {
    console.error("Update transaction failed:", txResult.errors)
    throw txResult.errors[0] || new Error("予約の更新に失敗しました")
  }

  return txResult.data!
}

export async function cancelAppointmentRecord(id: string): Promise<Appointment> {
  // Instead of physically deleting a record we mark it as cancelled so the
  // history stays auditable.
  const current = await getAppointmentById(id)
  if (!current) {
    throw new AppointmentNotFoundError()
  }

  // Execute within transaction
  const txResult = await executeInTransaction(async (context: TransactionContext) => {
    const timestamp = new Date().toISOString()
    const originalData = { ...current }
    
    // Database operation
    const appointment = await executeDatabaseOperation(
      context,
      "update",
      async () => {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .update({
            status: "cancelled",
            updated_at: timestamp,
          })
          .eq("id", id)
          .eq("clinic_id", CLINIC_ID)
          .select(appointmentSelect)
          .single()

        if (error) {
          console.error("Error cancelling appointment:", error)
          throw error
        }

        return formatAppointment(data)
      },
      originalData
    )

    // Calendar integration
    await executeCalendarOperation(
      context,
      "delete",
      async () => {
        const config = getIntegrationConfig()
        if (config.calendar) {
          return await config.calendar.deleteEvent(id)
        }
        return {}
      },
      originalData
    )

    // Spreadsheet integration
    await executeSpreadsheetOperation(
      context,
      "delete",
      async () => {
        const config = getIntegrationConfig()
        if (config.spreadsheet) {
          return await config.spreadsheet.deleteRow(id)
        }
        return {}
      },
      originalData
    )

    // Notification integration
    await executeNotificationOperation(
      context,
      "sendAppointmentCancelled",
      async () => {
        const config = getIntegrationConfig()
        if (config.notification) {
          return await config.notification.sendAppointmentCancelled(appointment)
        }
        return {}
      }
    )

    return appointment
  })

  if (!txResult.success) {
    console.error("Cancellation transaction failed:", txResult.errors)
    throw txResult.errors[0] || new Error("予約のキャンセルに失敗しました")
  }

  return txResult.data!
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(appointmentSelect)
    .eq("clinic_id", CLINIC_ID)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching appointment by id:", error)
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
    console.error("Error checking appointment conflict:", error)
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

export function serializeAppointmentForApi(appointment: Appointment): ReservationResponse {
  return {
    id: appointment.id,
    patient_id: appointment.patient_id,
    staff_id: appointment.staff_id,
    date: appointment.date,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    treatment_type: appointment.treatment_type,
    status: appointment.status,
    chair_number: appointment.chair_number,
    notes: appointment.notes,
    patient: appointment.patient,
    staff: appointment.staff,
  }
}
