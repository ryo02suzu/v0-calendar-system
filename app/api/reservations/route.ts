import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  AppointmentConflictError,
  createAppointmentRecord,
  getAppointmentsByDate,
  serializeAppointmentForApi,
} from "@/lib/server/appointments"
import { ensurePatientId } from "@/lib/server/patient"

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
  chair_number: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => Boolean(data.patient_id) || Boolean(data.patient), {
  message: "patient_id または患者情報を指定してください",
  path: ["patient_id"],
})

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 })
  }

  try {
    const data = await getAppointmentsByDate(date)
    return NextResponse.json({ data: data.map(serializeAppointmentForApi) })
  } catch (error) {
    console.error("[v0] Failed to fetch reservations:", error)
    return NextResponse.json({ error: "予約データの取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof reservationSchema>
  try {
    const json = await request.json()
    payload = reservationSchema.parse(json)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }
    console.error("[v0] Invalid reservation payload:", error)
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

    console.error("[v0] Failed to create reservation:", error)
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 })
  }
}

