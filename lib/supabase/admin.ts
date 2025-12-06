import { createClient } from "@supabase/supabase-js"

// Service Role Keyを使用してRLSをバイパスするクライアント。
// 機密キーを含むため、Route Handler や Server Action などの
// サーバーサイドコードからのみ import してください。

function validateEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Allow build-time to proceed without env vars
  // Validation will happen at runtime when the client is actually used
  if (!supabaseUrl || !serviceRoleKey) {
    const missing = []
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

    // During build time (not runtime), use placeholder values
    // This allows `next build` to succeed on Vercel even without env vars
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.VERCEL_ENV)
    
    if (isBuildTime) {
      console.warn(
        `Missing environment variables during build: ${missing.join(", ")}. ` +
        `This is expected during build. Ensure they are set at runtime.`
      )
      return {
        supabaseUrl: "https://placeholder.supabase.co",
        serviceRoleKey: "placeholder-key"
      }
    }

    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Please set these in your .env.local file or deployment environment.`
    )
  }

  // Basic validation of URL format
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". Must be a valid URL.`
    )
  }

  return { supabaseUrl, serviceRoleKey }
}

const { supabaseUrl, serviceRoleKey } = validateEnvVars()

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
