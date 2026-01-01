import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  AppointmentConflictError,
  createAppointmentRecord,
  getAppointmentsByDate,
  serializeAppointmentForApi,
} from "@/lib/server/appointments"
import { ensurePatientId } from "@/lib/server/patient"
import { AppointmentValidationError } from "@/lib/validations/appointment-validation"
import { applySecurityChecks } from "@/lib/security/api-security"

const patientSchema = z.object({
  name: z.string().min(1, "患者名は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().optional(),
})

const reservationSchema = z.object({
  patient_id: z.string().uuid().optional(),
  patient: patientSchema.optional(),
  staff_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  treatment_type: z.string().min(1),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  chair_number: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => Boolean(data.patient_id) || Boolean(data.patient), {
  message: "patient_id または患者情報を指定してください",
  path: ["patient_id"],
})

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 200, windowMs: 60 * 1000 }, // 200 requests per minute
  })
  
  if (!securityCheck.passed) {
    return NextResponse.json(
      { error: securityCheck.error },
      { status: 429 }
    )
  }

  const date = new URL(request.url).searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 })
  }

  try {
    const data = await getAppointmentsByDate(date)
    return NextResponse.json({ data: data.map(serializeAppointmentForApi) })
  } catch (error) {
    console.error("Failed to fetch reservations:", error)
    return NextResponse.json({ error: "予約データの取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Apply security checks including rate limiting
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
    validateOrigin: true,
  })
  
  if (!securityCheck.passed) {
    return NextResponse.json(
      { error: securityCheck.error },
      { 
        status: securityCheck.error?.includes("Too many") ? 429 : 403,
        headers: securityCheck.rateLimitInfo ? {
          "X-RateLimit-Limit": String(securityCheck.rateLimitInfo.remaining + 1),
          "X-RateLimit-Remaining": String(securityCheck.rateLimitInfo.remaining),
          "X-RateLimit-Reset": new Date(securityCheck.rateLimitInfo.resetTime).toISOString(),
        } : undefined,
      }
    )
  }

  let payload: z.infer<typeof reservationSchema>
  try {
    const json = await request.json()
    payload = reservationSchema.parse(json)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }
    console.error("Invalid reservation payload:", error)
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
  }

  try {
    const patientId = await ensurePatientId(payload.patient_id, payload.patient)
    const data = await createAppointmentRecord({
      patient_id: patientId,
      staff_id: payload.staff_id,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      treatment_type: payload.treatment_type,
      status: payload.status,
      chair_number: payload.chair_number,
      notes: payload.notes,
    })
    return NextResponse.json({ data: serializeAppointmentForApi(data) }, { status: 201 })
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    
    if (error instanceof AppointmentValidationError) {
      return NextResponse.json({ 
        error: error.message,
        validationErrors: error.validationResult.errors,
      }, { status: 400 })
    }

    console.error("Failed to create reservation:", error)
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 })
  }
}

