import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  AppointmentConflictError,
  AppointmentNotFoundError,
  cancelAppointmentRecord,
  serializeAppointmentForApi,
  updateAppointmentRecord,
} from "@/lib/server/appointments"
import { ensurePatientId } from "@/lib/server/patient"

const patientSchema = z.object({
  name: z.string().min(1, "患者名は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().optional(),
})

const updateSchema = z
  .object({
    patient_id: z.string().uuid().optional(),
    staff_id: z.string().uuid().optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    treatment_type: z.string().min(1).optional(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
    chair_number: z.number().int().positive().optional(),
    notes: z.string().max(1000).optional(),
    patient: patientSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "少なくとも1項目を指定してください",
  })

type RouteContext = {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  let payload: z.infer<typeof updateSchema>
  try {
    const json = await request.json()
    payload = updateSchema.parse(json)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }
    console.error("[v0] Invalid reservation update payload:", error)
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
  }

  try {
    let updates = { ...payload }
    if (payload.patient) {
      const patientId = await ensurePatientId(payload.patient_id, payload.patient)
      updates = { ...updates, patient_id: patientId }
    }

    const { patient: _patient, ...rest } = updates

    const data = await updateAppointmentRecord(params.id, rest)
    return NextResponse.json({ data: serializeAppointmentForApi(data) })
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error("[v0] Failed to update reservation:", error)
    return NextResponse.json({ error: "予約の更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const data = await cancelAppointmentRecord(params.id)
    return NextResponse.json({ data: serializeAppointmentForApi(data) })
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error("[v0] Failed to cancel reservation:", error)
    return NextResponse.json({ error: "予約のキャンセルに失敗しました" }, { status: 500 })
  }
}
