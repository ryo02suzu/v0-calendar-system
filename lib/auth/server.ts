import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { UserRole } from "@/lib/types/auth"
import { ROLE_PERMISSIONS, type Permission } from "@/lib/types/auth"

interface AuthResult {
  authenticated: boolean
  user?: {
    id: string
    email: string
    role: UserRole
    clinicId: string
  }
  error?: string
}

/**
 * サーバーサイドで Supabase Auth セッションを検証する。
 * Supabase が未設定（環境変数なし）の場合はフォールバックとして認証をスキップする。
 */
export async function getServerAuth(): Promise<AuthResult> {
  // Supabase 環境変数がない場合は従来の Basic Auth モードとしてスキップ
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { authenticated: true, user: { id: "basic-auth", email: "", role: "admin", clinicId: "" } }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")
          }
        }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { authenticated: false, error: "認証が必要です" }
    }

    const metadata = user.user_metadata || {}
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email || "",
        role: (metadata.role as UserRole) || "viewer",
        clinicId: metadata.clinic_id || "",
      }
    }
  } catch (error) {
    console.error("Server auth error:", error)
    return { authenticated: false, error: "認証エラー" }
  }
}

/**
 * サーバーサイドで権限チェックを行うヘルパー。
 */
export function checkServerPermission(
  role: UserRole,
  resource: keyof Permission,
  action: string
): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return (perms[resource] as Record<string, boolean>)?.[action] ?? false
}
