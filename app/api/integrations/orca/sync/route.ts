/**
 * POST /api/integrations/orca/sync
 *
 * ORCA APIと直接同期する。
 * ORCA_API_ENDPOINT と ORCA_API_KEY が未設定の場合は 503 を返す。
 */
import { NextResponse } from "next/server"
import { orcaIntegration } from "@/lib/integrations/orca"

export async function POST() {
  try {
    const result = await orcaIntegration.syncPatients()

    if (!result.success) {
      if (result.error === 'ORCA API not configured') {
        return NextResponse.json(
          { error: "ORCA API連携が設定されていません" },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: result.error || "ORCA同期に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, synced: result.synced })
  } catch (error) {
    console.error("[orca/sync] Error:", error)
    return NextResponse.json(
      { error: "ORCA同期処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
