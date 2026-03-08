import { NextRequest, NextResponse } from "next/server"
import { getReminderSettings, updateReminderSettings } from "@/lib/db"
import { applySecurityChecks } from "@/lib/security/api-security"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

/**
 * GET /api/reminder-settings
 * リマインダー設定を取得します。
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
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "settings", "edit")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
    validateOrigin: true,
  })
  if (!securityCheck.passed) {
    return NextResponse.json({ error: securityCheck.error }, { status: 429 })
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
