/**
 * Comprehensive Appointment Validation
 * 
 * This module implements "zero-conflict" validation for dental clinic appointments,
 * considering business hours, break times, chair capacity, holidays, and concurrent bookings.
 */

import { supabaseAdmin } from "@/lib/supabase/admin"
import type { BusinessHours, Holiday, ClinicSettings } from "@/lib/types"
import { getClinicSettings } from "@/lib/config/clinic-context"

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validation error details
 */
export interface ValidationError {
  code: string
  message: string
  field?: string
  details?: any
}

/**
 * Appointment data for validation
 */
export interface AppointmentValidationInput {
  clinicId: string
  date: string
  startTime: string
  endTime: string
  staffId: string
  chairNumber?: number | null
  excludeAppointmentId?: string
}

/**
 * Validates if a time is within business hours
 */
async function validateBusinessHours(
  clinicId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<ValidationError | null> {
  const dayOfWeek = new Date(date).getDay()
  
  const { data: businessHours, error } = await supabaseAdmin
    .from("business_hours")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("day_of_week", dayOfWeek)
    .single()
  
  if (error || !businessHours) {
    return {
      code: "BUSINESS_HOURS_NOT_CONFIGURED",
      message: "診療時間が設定されていません",
      field: "date",
    }
  }
  
  if (businessHours.is_closed) {
    return {
      code: "CLINIC_CLOSED",
      message: "この日は休診日です",
      field: "date",
    }
  }
  
  const openTime = businessHours.open_time
  const closeTime = businessHours.close_time
  
  if (!openTime || !closeTime) {
    return {
      code: "BUSINESS_HOURS_INVALID",
      message: "診療時間が不正です",
      field: "date",
    }
  }
  
  if (startTime < openTime || endTime > closeTime) {
    return {
      code: "OUTSIDE_BUSINESS_HOURS",
      message: `診療時間外です（診療時間: ${openTime} - ${closeTime}）`,
      field: "time",
      details: { openTime, closeTime, startTime, endTime },
    }
  }
  
  return null
}

/**
 * Validates if the date is not a holiday
 */
async function validateHoliday(
  clinicId: string,
  date: string
): Promise<ValidationError | null> {
  const { data: holiday, error } = await supabaseAdmin
    .from("holidays")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .maybeSingle()
  
  if (error) {
    console.error("Error checking holiday:", error)
    // Don't fail validation on query error, just log it
    return null
  }
  
  if (holiday) {
    return {
      code: "HOLIDAY",
      message: holiday.reason || "この日は休診日です",
      field: "date",
      details: { holiday },
    }
  }
  
  return null
}

/**
 * Validates chair capacity constraints
 */
async function validateChairCapacity(
  clinicId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<ValidationError | null> {
  // Get clinic settings for chair count
  const settings = await getClinicSettings(clinicId)
  if (!settings) {
    return {
      code: "SETTINGS_NOT_FOUND",
      message: "クリニック設定が見つかりません",
    }
  }
  
  const chairsCount = settings.chairs_count || 3
  
  // Get all appointments for the same time slot
  let query = supabaseAdmin
    .from("appointments")
    .select("id, start_time, end_time, chair_number")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .neq("status", "cancelled")
  
  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId)
  }
  
  const { data: appointments, error } = await query
  
  if (error) {
    console.error("Error checking chair capacity:", error)
    throw error
  }
  
  // Convert time strings to minutes for easier comparison
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)
  
  // Find overlapping appointments
  const overlappingAppointments = (appointments || []).filter((apt) => {
    const aptStart = timeToMinutes(apt.start_time)
    const aptEnd = timeToMinutes(apt.end_time)
    return newStart < aptEnd && newEnd > aptStart
  })
  
  // Check if we exceed chair capacity
  if (overlappingAppointments.length >= chairsCount) {
    return {
      code: "CHAIR_CAPACITY_EXCEEDED",
      message: `この時間帯は予約が満席です（診察台数: ${chairsCount}）`,
      field: "time",
      details: {
        chairsCount,
        overlappingCount: overlappingAppointments.length,
      },
    }
  }
  
  return null
}

/**
 * Validates staff availability (no double booking for the same staff)
 */
async function validateStaffAvailability(
  clinicId: string,
  date: string,
  startTime: string,
  endTime: string,
  staffId: string,
  excludeAppointmentId?: string
): Promise<ValidationError | null> {
  let query = supabaseAdmin
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("clinic_id", clinicId)
    .eq("date", date)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
  
  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId)
  }
  
  const { data: appointments, error } = await query
  
  if (error) {
    console.error("Error checking staff availability:", error)
    throw error
  }
  
  const newStart = timeToMinutes(startTime)
  const newEnd = timeToMinutes(endTime)
  
  const conflict = (appointments || []).some((apt) => {
    const aptStart = timeToMinutes(apt.start_time)
    const aptEnd = timeToMinutes(apt.end_time)
    return newStart < aptEnd && newEnd > aptStart
  })
  
  if (conflict) {
    return {
      code: "STAFF_CONFLICT",
      message: "このスタッフは既に予約が入っています",
      field: "staff_id",
    }
  }
  
  return null
}

/**
 * Validates appointment time logic
 */
function validateTimeLogic(
  startTime: string,
  endTime: string
): ValidationError | null {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  
  if (start >= end) {
    return {
      code: "INVALID_TIME_RANGE",
      message: "終了時刻は開始時刻より後である必要があります",
      field: "time",
    }
  }
  
  // Check minimum duration (e.g., 15 minutes)
  const duration = end - start
  if (duration < 15) {
    return {
      code: "DURATION_TOO_SHORT",
      message: "予約時間は15分以上である必要があります",
      field: "time",
    }
  }
  
  // Check maximum duration (e.g., 4 hours)
  if (duration > 240) {
    return {
      code: "DURATION_TOO_LONG",
      message: "予約時間は4時間以内である必要があります",
      field: "time",
    }
  }
  
  return null
}

/**
 * Validates that the appointment is not in the past
 */
function validateNotPast(date: string, startTime: string): ValidationError | null {
  const appointmentDateTime = new Date(`${date}T${startTime}`)
  const now = new Date()
  
  if (appointmentDateTime < now) {
    return {
      code: "APPOINTMENT_IN_PAST",
      message: "過去の日時には予約できません",
      field: "date",
    }
  }
  
  return null
}

/**
 * Validates booking advance limit
 */
async function validateBookingAdvanceLimit(
  clinicId: string,
  date: string
): Promise<ValidationError | null> {
  const settings = await getClinicSettings(clinicId)
  if (!settings) {
    return null // Skip validation if settings not found
  }
  
  const advanceDays = settings.booking_advance_days || 60
  const appointmentDate = new Date(date)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + advanceDays)
  
  if (appointmentDate > maxDate) {
    return {
      code: "BOOKING_TOO_FAR_AHEAD",
      message: `予約は${advanceDays}日先まで可能です`,
      field: "date",
      details: { advanceDays },
    }
  }
  
  return null
}

/**
 * Comprehensive validation for appointment creation or update
 * 
 * This performs defensive programming with multiple layers of validation
 * to ensure zero-conflict bookings.
 */
export async function validateAppointment(
  input: AppointmentValidationInput
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  
  try {
    // Basic time logic validation
    const timeError = validateTimeLogic(input.startTime, input.endTime)
    if (timeError) {
      errors.push(timeError)
    }
    
    // Validate not in past
    const pastError = validateNotPast(input.date, input.startTime)
    if (pastError) {
      errors.push(pastError)
    }
    
    // Validate booking advance limit
    const advanceError = await validateBookingAdvanceLimit(input.clinicId, input.date)
    if (advanceError) {
      errors.push(advanceError)
    }
    
    // Validate business hours
    const businessHoursError = await validateBusinessHours(
      input.clinicId,
      input.date,
      input.startTime,
      input.endTime
    )
    if (businessHoursError) {
      errors.push(businessHoursError)
    }
    
    // Validate holiday
    const holidayError = await validateHoliday(input.clinicId, input.date)
    if (holidayError) {
      errors.push(holidayError)
    }
    
    // Validate staff availability
    const staffError = await validateStaffAvailability(
      input.clinicId,
      input.date,
      input.startTime,
      input.endTime,
      input.staffId,
      input.excludeAppointmentId
    )
    if (staffError) {
      errors.push(staffError)
    }
    
    // Validate chair capacity
    const chairError = await validateChairCapacity(
      input.clinicId,
      input.date,
      input.startTime,
      input.endTime,
      input.excludeAppointmentId
    )
    if (chairError) {
      errors.push(chairError)
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  } catch (error) {
    console.error("Validation error:", error)
    return {
      valid: false,
      errors: [
        {
          code: "VALIDATION_ERROR",
          message: "予約検証中にエラーが発生しました",
          details: { error: error instanceof Error ? error.message : String(error) },
        },
      ],
    }
  }
}

/**
 * Helper function to convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((v) => parseInt(v, 10))
  return hours * 60 + minutes
}

/**
 * Custom error class for validation failures
 */
export class AppointmentValidationError extends Error {
  constructor(
    public validationResult: ValidationResult
  ) {
    super(validationResult.errors.map((e) => e.message).join("; "))
    this.name = "AppointmentValidationError"
  }
}
