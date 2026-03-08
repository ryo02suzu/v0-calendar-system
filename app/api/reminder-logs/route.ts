import { NextRequest, NextResponse } from "next/server"
import { getReminderLogs } from "@/lib/db"
import { applySecurityChecks } from "@/lib/security/api-security"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

/**
 * GET /api/reminder-logs
 * リマインダー送信ログを取得します。
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "settings", "view")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 60, windowMs: 60 * 1000 },
  })
  if (!securityCheck.passed) {
    return NextResponse.json({ error: securityCheck.error }, { status: 429 })
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
