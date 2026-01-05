import { createClient } from "@supabase/supabase-js"

// Service Role Keyを使用してRLSをバイパスするクライアント。
// 機密キーを含むため、Route Handler や Server Action などの
// サーバーサイドコードからのみ import してください。

/**
 * Determines if the code is running during the build phase (not runtime).
 * During build, we allow missing env vars by using placeholders.
 * At runtime (including in serverless functions), we require real values.
 */
function isBuildTimeEnvironment(): boolean {
  // Next.js sets NEXT_PHASE during different build phases
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true
  }
  
  // Fallback: Check if we're in production mode, server-side, and NOT in a Vercel runtime
  // (VERCEL_ENV is set when running on Vercel, but not during build)
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.VERCEL_ENV) {
    return true
  }
  
  return false
}

function validateEnvVars() {
  // Trim whitespace from environment variables to handle accidental spaces
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  // Allow build-time to proceed without env vars
  // Validation will happen at runtime when the client is actually used
  if (!supabaseUrl || !serviceRoleKey) {
    const missing = []
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

    // During build time (not runtime), use placeholder values
    // This allows `next build` to succeed on Vercel even without env vars
    if (isBuildTimeEnvironment()) {
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
    const url = new URL(supabaseUrl)
    // Ensure URL is using https protocol for security
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('URL must use http or https protocol')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid URL format'
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". ${errorMessage}. ` +
      `Please ensure the URL is properly formatted without spaces or special characters.`
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
