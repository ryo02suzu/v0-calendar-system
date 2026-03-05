import { NextRequest, NextResponse } from "next/server"

import { getBusinessHours, getHolidays, getStaff } from "@/lib/db"
import { getAppointmentsByDate } from "@/lib/server/appointments"

export async function GET(request: NextRequest) {
  const date = new URL(request.url).searchParams.get("date")
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 })
  }

  try {
    const [businessHours, holidays, staff, appointments] = await Promise.all([
      getBusinessHours(),
      getHolidays(),
      getStaff(),
      getAppointmentsByDate(date),
    ])

    const dayOfWeek = new Date(date + "T00:00:00").getDay()
    const todayHours = businessHours.find((h) => h.day_of_week === dayOfWeek) ?? null
    const isHoliday = holidays.some((h) => h.date === date)

    return NextResponse.json({
      data: {
        date,
        isHoliday,
        businessHours: todayHours
          ? {
              open_time: todayHours.open_time ?? "09:00",
              close_time: todayHours.close_time ?? "18:00",
              is_closed: todayHours.is_closed ?? false,
            }
          : { open_time: "09:00", close_time: "18:00", is_closed: true },
        existingAppointments: appointments.map((a) => ({
          staff_id: a.staff_id,
          start_time: a.start_time,
          end_time: a.end_time,
        })),
        staff: staff.map((s) => ({ id: s.id, name: s.name })),
      },
    })
  } catch (error) {
    console.error("Failed to fetch availability:", error)
    return NextResponse.json({ error: "空き状況の取得に失敗しました" }, { status: 500 })
  }
}
