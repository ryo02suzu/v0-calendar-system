import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

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

// === Supabase Auth（@supabase/ssr 使用） ===
async function checkSupabaseAuth(request: NextRequest): Promise<{ authenticated: boolean; response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Supabase 未設定時は開発環境向けフォールバックとしてアクセスを許可
  if (!supabaseUrl || !supabaseAnonKey) {
    return { authenticated: true, response: NextResponse.next({ request }) }
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

  const { authenticated, response } = await checkSupabaseAuth(request)
  if (!authenticated) {
    // 未認証 → ログインページにリダイレクト
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}