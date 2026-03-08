/**
 * GET /api/integrations/google/callback
 *
 * Google Calendar OAuth認証コールバック。
 * 認証コードをアクセストークンと交換し、セッションに保存する。
 */
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.json(
      { error: error || "認証コードが取得できませんでした" },
      { status: 400 }
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google Calendar連携が設定されていません" },
      { status: 503 }
    )
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/integrations/google/callback`
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text()
      return NextResponse.json(
        { error: `トークン取得エラー: ${tokenResponse.status} ${body}` },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()

    // アクセストークンを返す（実運用ではセキュアなストレージへ保存推奨）
    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    })
  } catch (err: any) {
    console.error("[google/callback] Error:", err)
    return NextResponse.json(
      { error: "認証処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
