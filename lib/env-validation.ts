/**
 * Environment variable validation utilities
 * Provides shared validation logic for Supabase configuration
 */

/**
 * Custom error class for environment configuration issues
 */
export class EnvConfigError extends Error {
  constructor(message: string, public details?: string) {
    super(message)
    this.name = 'EnvConfigError'
  }
}

export interface EnvValidationResult {
  isValid: boolean
  supabaseUrl?: string
  serviceRoleKey?: string
  anonKey?: string
  error?: {
    message: string
    details: string
  }
}

/**
 * Validates and trims Supabase environment variables
 * Returns validation result with trimmed values or error information
 */

// JWT signature length validation constants
const MIN_JWT_SIGNATURE_LENGTH = 20; // Minimum to be considered a valid attempt
const EXPECTED_JWT_SIGNATURE_LENGTH = 43; // Typical HS256 signature length

export function validateSupabaseEnv(): EnvValidationResult {
  // Trim whitespace from environment variables to handle accidental spaces
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Check for missing required variables
  if (!supabaseUrl || !serviceRoleKey) {
    const missing = []
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

    return {
      isValid: false,
      error: {
        message: "Service configuration error",
        details: `Missing required environment variables: ${missing.join(", ")}`
      }
    }
  }

  // Validate JWT format for service role key
  const jwtParts = serviceRoleKey.split('.')
  if (jwtParts.length !== 3) {
    return {
      isValid: false,
      error: {
        message: "Service configuration error",
        details: `Invalid SUPABASE_SERVICE_ROLE_KEY: JWT must have 3 parts (header.payload.signature), found ${jwtParts.length}. Please verify the key is copied completely from Supabase Settings > API.`
      }
    }
  }

  // Validate signature length (JWT signatures with HS256 are typically 43 characters in base64url)
  const signature = jwtParts[2]
  if (signature.length < MIN_JWT_SIGNATURE_LENGTH) {
    return {
      isValid: false,
      error: {
        message: "Service configuration error",
        details: `Invalid SUPABASE_SERVICE_ROLE_KEY: Signature appears truncated (${signature.length} characters). JWT signatures should be approximately ${EXPECTED_JWT_SIGNATURE_LENGTH} characters. Please copy the complete key from Supabase Settings > API > service_role key.`
      }
    }
  }

  // Validate URL format
  try {
    const url = new URL(supabaseUrl)
    
    // Ensure URL is using http or https protocol
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return {
        isValid: false,
        error: {
          message: "Service configuration error",
          details: "Invalid Supabase URL: must use http or https protocol"
        }
      }
    }

    // Warn about HTTP in production
    if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
      console.error(
        'SECURITY WARNING: Using HTTP protocol for Supabase URL in production environment. ' +
        'This is insecure and should only be used for local development. ' +
        'Please update to use HTTPS.'
      )
    }

    return {
      isValid: true,
      supabaseUrl,
      serviceRoleKey,
      anonKey
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid URL format'
    return {
      isValid: false,
      error: {
        message: "Service configuration error",
        details: `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". ${errorMessage}. Please ensure the URL is properly formatted without spaces or special characters.`
      }
    }
  }
}
