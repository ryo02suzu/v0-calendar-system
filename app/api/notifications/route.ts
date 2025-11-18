import { NextResponse } from "next/server"
import { getNotifications } from "@/lib/db"

export async function GET() {
  try {
    const data = await getNotifications(50)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to fetch notifications:", error)
    return NextResponse.json({ error: "通知データの取得に失敗しました" }, { status: 500 })
  }
}
