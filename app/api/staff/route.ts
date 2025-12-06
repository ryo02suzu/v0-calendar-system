import { NextResponse } from "next/server"

import { getStaff } from "@/lib/db"

export async function GET() {
  try {
    const data = await getStaff()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch staff:", error)
    return NextResponse.json({ error: "スタッフ情報の取得に失敗しました" }, { status: 500 })
  }
}
