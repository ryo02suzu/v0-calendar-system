import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const REALM = "DentalDashboard"

// 公開パス（認証不要）
const PUBLIC_PATHS = [
  "/reserve",
  "/login",
  "/api/availability",
  "/api/clinic",
  "/api/services",
  "/api/staff",
  "/api/reservations",
  "/api/reservations/public",
  "/api/cron",
  "/api/export",
  "/api/integrations/orca",
  "/manifest.json",
  "/sw.js",
  "/icons",
]

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  )
}

// === Basic Auth（従来方式） ===
function decodeBasicToken(authorizationHeader: string | null): { username: string; password: string } | null {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return null
  }

  try {
    const encoded = authorizationHeader.split(" ")[1] ?? ""
    const decoded = Buffer.from(encoded, "base64").toString("utf8")
    const separatorIndex = decoded.indexOf(":")
    if (separatorIndex === -1) {
      return null
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch (error) {
    console.warn("Failed to decode Authorization header:", error)
    return null
  }
}

function unauthorizedBasicResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  })
}

// === Supabase Auth ===
async function checkSupabaseAuth(request: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return false

  // CookieからSupabaseセッショントークンを取得
  const accessToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get(`sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`)?.value

  if (!accessToken) {
    // ヘッダーからBearerトークンを試す（API呼び出し用）
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey)
        const { data } = await client.auth.getUser(token)
        return !!data.user
      } catch {
        return false
      }
    }
    return false
  }

  try {
    // Cookieのトークンを検証するためにJSON parseを試す
    let tokenStr = accessToken
    try {
      const parsed = JSON.parse(accessToken)
      tokenStr = parsed.access_token || parsed[0]?.access_token || accessToken
    } catch {
      // JSON parseに失敗した場合はそのまま使用
    }
    const client = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await client.auth.getUser(tokenStr)
    return !!data.user
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 公開パスはスキップ
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const useSupabaseAuth = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  if (useSupabaseAuth) {
    // === Supabase Auth モード ===
    const isAuthenticated = await checkSupabaseAuth(request)
    if (!isAuthenticated) {
      // 未認証 → ログインページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  } else {
    // === Basic Auth モード（従来互換） ===
    const requiredUser = process.env.DASHBOARD_BASIC_AUTH_USER
    const requiredPassword = process.env.DASHBOARD_BASIC_AUTH_PASSWORD

    if (!requiredUser || !requiredPassword) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "WARNING: Basic auth credentials are not configured in production."
        )
      }
      return NextResponse.next()
    }

    const credentials = decodeBasicToken(request.headers.get("authorization"))
    if (!credentials) return unauthorizedBasicResponse()
    if (credentials.username !== requiredUser || credentials.password !== requiredPassword) {
      return unauthorizedBasicResponse()
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}