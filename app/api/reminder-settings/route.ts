import { NextRequest, NextResponse } from "next/server"
import { getReminderSettings, updateReminderSettings } from "@/lib/db"
import { applySecurityChecks } from "@/lib/security/api-security"

/**
 * GET /api/reminder-settings
 * リマインダー設定を取得します。
 */
export async function GET(request: NextRequest) {
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 60, windowMs: 60 * 1000 },
  })
  if (!securityCheck.success) {
    return securityCheck.response!
  }

  try {
    const settings = await getReminderSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error("[reminder-settings] GET error:", error)
    return NextResponse.json(
      { error: "リマインダー設定の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reminder-settings
 * リマインダー設定を更新します。
 */
export async function PUT(request: NextRequest) {
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
    validateOrigin: true,
  })
  if (!securityCheck.success) {
    return securityCheck.response!
  }

  try {
    const body = await request.json()
    const updated = await updateReminderSettings(body)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("[reminder-settings] PUT error:", error)
    return NextResponse.json(
      { error: "リマインダー設定の更新に失敗しました" },
      { status: 500 }
    )
  }
}
