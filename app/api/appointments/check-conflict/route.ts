import { NextResponse } from "next/server"
import { checkAppointmentConflict } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, start_time, end_time, staff_id, chair_number, exclude_id } = body

    if (!date || !start_time || !end_time || !staff_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await checkAppointmentConflict(
      date,
      start_time,
      end_time,
      staff_id,
      chair_number,
      exclude_id
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking appointment conflict:", error)
    return NextResponse.json({ error: "Failed to check conflict" }, { status: 500 })
  }
}
