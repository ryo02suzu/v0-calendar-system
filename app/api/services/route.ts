import { NextResponse } from "next/server"

import { getServices } from "@/lib/db"

// Fetch all services from the database
export async function GET() {
  try {
    const data = await getServices()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to fetch services:", error)
    return NextResponse.json({ error: "サービス情報の取得に失敗しました" }, { status: 500 })
  }
}
