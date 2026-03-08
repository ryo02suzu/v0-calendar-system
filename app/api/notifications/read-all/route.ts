export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server"
import { markAllNotificationsRead } from "@/lib/db"
import { getServerAuth } from "@/lib/auth/server"

export async function POST() {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const data = await markAllNotificationsRead()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return NextResponse.json({ error: "通知を既読にできませんでした" }, { status: 500 })
  }
}
