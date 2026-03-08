/**
 * GET /api/integrations/orca/export
 *
 * 患者データをORCA CSV形式でエクスポートする。
 */
import { NextResponse } from "next/server"
import { getPatients } from "@/lib/db"
import { orcaIntegration } from "@/lib/integrations/orca"

export async function GET() {
  try {
    const patients = await getPatients()
    const csv = orcaIntegration.exportPatientsCsv(patients)
    const filename = `orca-patients-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[orca/export] Error:", error)
    return NextResponse.json(
      { error: "ORCAエクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
