import { NextResponse } from "next/server"
import { markAllNotificationsRead } from "@/lib/db"

export async function POST() {
  try {
    const data = await markAllNotificationsRead()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to mark all notifications as read:", error)
    return NextResponse.json({ error: "通知を既読にできませんでした" }, { status: 500 })
  }
}
