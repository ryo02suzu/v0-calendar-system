/**
 * GET /api/export/appointments
 *
 * 予約一覧をCSVまたはPDF（印刷用HTML）形式でエクスポートする。
 *
 * クエリパラメータ:
 * - format: 'csv' | 'pdf' (デフォルト: 'csv')
 * - from: 開始日 (YYYY-MM-DD)
 * - to: 終了日 (YYYY-MM-DD)
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppointmentsByDateRange, getAppointments } from "@/lib/db"
import { generateAppointmentsCsv } from "@/lib/export/csv-generator"
import { generateAppointmentsPdfHtml } from "@/lib/export/pdf-generator"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    let appointments: any[]
    if (from && to) {
      appointments = await getAppointmentsByDateRange(from, to)
    } else {
      appointments = await getAppointments()
    }

    if (format === "pdf") {
      const html = generateAppointmentsPdfHtml(appointments)
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    // デフォルト: CSV
    const csv = generateAppointmentsCsv(appointments)
    const filename = `appointments-${new Date().toISOString().split("T")[0]}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[export/appointments] Error:", error)
    return NextResponse.json(
      { error: "予約データのエクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
