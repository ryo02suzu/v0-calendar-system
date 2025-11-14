import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  AppointmentConflictError,
  createAppointmentRecord,
  getAppointmentsByDate,
} from "@/lib/server/appointments"

const reservationSchema = z.object({
  patient_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  treatment_type: z.string().min(1),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  chair_number: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 })
  }

  try {
    const data = await getAppointmentsByDate(date)
    return NextResponse.json({ data })
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
    const data = await createAppointmentRecord(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error("[v0] Failed to create reservation:", error)
    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 })
  }
}
