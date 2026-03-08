import { NextResponse } from "next/server"

import { getStaff } from "@/lib/db"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

export async function GET() {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "staff", "view")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const data = await getStaff()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch staff:", error)
    return NextResponse.json({ error: "スタッフ情報の取得に失敗しました" }, { status: 500 })
  }
}
