import { createClient } from "@supabase/supabase-js"

// ビルド時は環境変数が未設定でも動作するようにフォールバック値を使用します。
// 実際の Realtime 接続はブラウザ実行時にのみ行われます。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase/client] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
    "Realtime features will be disabled. Set this variable to enable real-time sync."
  )
}

/**
 * ブラウザ用 Supabase クライアント（anon key 使用）。
 * Realtime subscriptions やクライアントサイドの操作に使用します。
 * NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていない場合は Realtime 機能は無効になります。
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
