import { NextRequest, NextResponse } from "next/server"
import { getReminderLogs } from "@/lib/db"
import { applySecurityChecks } from "@/lib/security/api-security"

/**
 * GET /api/reminder-logs
 * リマインダー送信ログを取得します。
 */
export async function GET(request: NextRequest) {
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 60, windowMs: 60 * 1000 },
  })
  if (!securityCheck.success) {
    return securityCheck.response!
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100)

    const logs = await getReminderLogs(limit)
    return NextResponse.json({ data: logs })
  } catch (error) {
    console.error("[reminder-logs] Error:", error)
    return NextResponse.json(
      { error: "リマインダーログの取得に失敗しました" },
      { status: 500 }
    )
  }
}
