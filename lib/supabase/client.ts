import { createBrowserClient } from "@supabase/ssr"

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase/client] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "Realtime features will be disabled. Set this variable to enable real-time sync."
  )
}

let _client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Supabase が適切に設定されている場合にクライアントを返します。
 * 未設定の場合は null を返します（Auth 機能が無効なことを示します）。
 * シングルトンパターンでインスタンスを再利用します。
 */
export function getSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return _client
}

/**
 * ブラウザ用 Supabase クライアント（anon key 使用）。
 * Realtime subscriptions やクライアントサイドの操作に使用します。
 * NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていない場合は Realtime 機能は無効になります。
 * 後方互換のためのエクスポート。getSupabaseClient() の使用を推奨します。
 */
export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
)
