export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server"
import { getNotifications } from "@/lib/db"
import { getServerAuth } from "@/lib/auth/server"

export async function GET() {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const data = await getNotifications(50)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json({ error: "通知データの取得に失敗しました" }, { status: 500 })
  }
}
