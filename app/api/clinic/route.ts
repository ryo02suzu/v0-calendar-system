import { NextResponse } from "next/server"

import { getClinic, getClinicSettings } from "@/lib/db"

export async function GET() {
  try {
    const [clinic, settings] = await Promise.all([getClinic(), getClinicSettings()])

    return NextResponse.json({
      data: {
        name: clinic?.name ?? "クリニック",
        phone: clinic?.phone ?? "",
        address: clinic?.address ?? "",
        bookingAdvanceDays: settings?.booking_advance_days ?? 60,
      },
    })
  } catch (error) {
    console.error("Failed to fetch clinic info:", error)
    return NextResponse.json({ error: "クリニック情報の取得に失敗しました" }, { status: 500 })
  }
}
