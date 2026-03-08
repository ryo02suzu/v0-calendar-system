/**
 * GET /api/export/revenue
 *
 * 売上レポートをCSV形式でエクスポートする。
 * 予約データから日付ごとの集計を行う。
 *
 * クエリパラメータ:
 * - format: 'csv' (現在はCSVのみ対応)
 * - from: 開始日 (YYYY-MM-DD)
 * - to: 終了日 (YYYY-MM-DD)
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppointmentsByDateRange, getAppointments } from "@/lib/db"
import { generateRevenueCsv } from "@/lib/export/csv-generator"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    let appointments: any[]
    if (from && to) {
      appointments = await getAppointmentsByDateRange(from, to)
    } else {
      appointments = await getAppointments()
    }

    // 日付ごとに集計
    const revenueMap = new Map<string, { count: number; revenue: number }>()
    for (const apt of appointments) {
      if (apt.status === "cancelled") continue
      const date = apt.date
      const price = apt.service?.price || apt.price || 0
      const entry = revenueMap.get(date) || { count: 0, revenue: 0 }
      entry.count++
      entry.revenue += price
      revenueMap.set(date, entry)
    }

    const revenueData = Array.from(revenueMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { count, revenue }]) => ({
        date,
        count,
        revenue,
        average: count > 0 ? Math.round(revenue / count) : 0,
      }))

    const csv = generateRevenueCsv(revenueData)
    const filename = `revenue-${new Date().toISOString().split("T")[0]}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[export/revenue] Error:", error)
    return NextResponse.json(
      { error: "売上データのエクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
