import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const REALM = "DentalDashboard"

// 公開パス（認証不要）
const PUBLIC_PATHS = [
  "/reserve",
  "/login",
  "/auth/callback", // OAuth・メール確認コールバック（認証処理前のため認証不要）
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

// === Supabase Auth（@supabase/ssr 使用） ===
async function checkSupabaseAuth(request: NextRequest): Promise<{ authenticated: boolean; response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { authenticated: false, response: NextResponse.next({ request }) }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // ヘッダーからBearerトークンを試す（API呼び出し用）
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    try {
      const { data } = await supabase.auth.getUser(token)
      return { authenticated: !!data.user, response: supabaseResponse }
    } catch {
      return { authenticated: false, response: supabaseResponse }
    }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { authenticated: !!user, response: supabaseResponse }
  } catch {
    return { authenticated: false, response: supabaseResponse }
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
    const { authenticated, response } = await checkSupabaseAuth(request)
    if (!authenticated) {
      // 未認証 → ログインページにリダイレクト
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
    return response
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