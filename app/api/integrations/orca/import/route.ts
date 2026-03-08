/**
 * POST /api/integrations/orca/import
 *
 * ORCA CSV形式の患者データをインポートする。
 * リクエストボディ: CSV文字列（text/plain または application/octet-stream）
 */
import { NextRequest, NextResponse } from "next/server"
import { orcaIntegration } from "@/lib/integrations/orca"

export async function POST(request: NextRequest) {
  try {
    const csvContent = await request.text()

    if (!csvContent.trim()) {
      return NextResponse.json(
        { error: "CSVデータが空です" },
        { status: 400 }
      )
    }

    const patients = orcaIntegration.parsePatientsCsv(csvContent)

    return NextResponse.json({
      success: true,
      parsed: patients.length,
      patients,
    })
  } catch (error) {
    console.error("[orca/import] Error:", error)
    return NextResponse.json(
      { error: "ORCAインポートに失敗しました" },
      { status: 500 }
    )
  }
}
