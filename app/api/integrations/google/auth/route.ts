/**
 * GET /api/integrations/google/auth
 *
 * Google Calendar OAuth認証を開始する。
 * GOOGLE_CLIENT_ID が未設定の場合は 503 を返す。
 */
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: "Google Calendar連携が設定されていません" },
      { status: 503 }
    )
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/integrations/google/callback`
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events")
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`

  return NextResponse.redirect(authUrl)
}
