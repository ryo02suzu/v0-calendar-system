/**
 * GET /api/export/patients
 *
 * 患者一覧をCSVまたはPDF（印刷用HTML）形式でエクスポートする。
 *
 * クエリパラメータ:
 * - format: 'csv' | 'pdf' (デフォルト: 'csv')
 */
import { NextRequest, NextResponse } from "next/server"
import { getPatients } from "@/lib/db"
import { generatePatientsCsv } from "@/lib/export/csv-generator"
import { generatePatientsPdfHtml } from "@/lib/export/pdf-generator"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const patients = await getPatients()

    if (format === "pdf") {
      const html = generatePatientsPdfHtml(patients)
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    // デフォルト: CSV
    const csv = generatePatientsCsv(patients)
    const filename = `patients-${new Date().toISOString().split("T")[0]}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[export/patients] Error:", error)
    return NextResponse.json(
      { error: "患者データのエクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
