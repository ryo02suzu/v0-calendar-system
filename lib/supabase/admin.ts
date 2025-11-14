import { createClient } from "@supabase/supabase-js"

// Service Role Keyを使用してRLSをバイパスするクライアント。
// 機密キーを含むため、Route Handler や Server Action などの
// サーバーサイドコードからのみ import してください。
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
