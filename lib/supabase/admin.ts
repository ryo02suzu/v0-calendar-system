import { createClient } from "@supabase/supabase-js"
import { validateSupabaseEnv } from "@/lib/env-validation"

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
  const validation = validateSupabaseEnv()

  // Allow build-time to proceed without env vars
  // Validation will happen at runtime when the client is actually used
  if (!validation.isValid) {
    // During build time (not runtime), use placeholder values
    // This allows `next build` to succeed on Vercel even without env vars
    if (isBuildTimeEnvironment()) {
      console.warn(
        `Missing environment variables during build. ` +
        `This is expected during build. Ensure they are set at runtime.`
      )
      return {
        supabaseUrl: "https://placeholder.supabase.co",
        serviceRoleKey: "placeholder-key"
      }
    }

    throw new Error(validation.error?.details || 'Invalid environment configuration')
  }

  return { 
    supabaseUrl: validation.supabaseUrl!,
    serviceRoleKey: validation.serviceRoleKey!
  }
}

const { supabaseUrl, serviceRoleKey } = validateEnvVars()

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
