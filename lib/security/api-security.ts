/**
 * Security Enhancements for API Routes
 * 
 * This module provides security utilities including rate limiting,
 * CSRF protection, and request validation.
 */

import { NextRequest } from "next/server"

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number
  
  /**
   * Time window in milliseconds
   */
  windowMs: number
  
  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (request: NextRequest) => string
}

/**
 * Rate limit entry for tracking requests
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting
 * In production, consider using Redis or similar distributed cache
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Cleans up expired entries from the rate limit store
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimitStore, 60 * 1000)

/**
 * Default rate limit configuration
 */
const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  identifier: (request) => {
    // Try to get IP from various headers
    const forwarded = request.headers.get("x-forwarded-for")
    const real = request.headers.get("x-real-ip")
    const cloudflare = request.headers.get("cf-connecting-ip")
    
    return cloudflare || real || forwarded?.split(",")[0] || "unknown"
  },
}

/**
 * Checks if a request exceeds the rate limit
 * 
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns Object with limited flag and remaining requests
 */
export function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; resetTime: number } {
  const finalConfig = { ...defaultRateLimitConfig, ...config }
  const identifier = finalConfig.identifier!(request)
  const now = Date.now()
  
  let entry = rateLimitStore.get(identifier)
  
  if (!entry || entry.resetTime <= now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + finalConfig.windowMs,
    }
    rateLimitStore.set(identifier, entry)
  }
  
  entry.count++
  
  const limited = entry.count > finalConfig.maxRequests
  const remaining = Math.max(0, finalConfig.maxRequests - entry.count)
  
  return {
    limited,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * CSRF token generation and validation
 */
const CSRF_TOKEN_HEADER = "x-csrf-token"
const CSRF_SECRET = process.env.CSRF_SECRET || "default-csrf-secret-change-in-production"

/**
 * Generates a CSRF token
 * 
 * @param sessionId - Unique session identifier
 * @returns CSRF token string
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now()
  const data = `${sessionId}:${timestamp}`
  
  // Simple implementation - in production, use proper cryptographic signing
  const hash = simpleHash(data + CSRF_SECRET)
  
  return Buffer.from(`${data}:${hash}`).toString("base64")
}

/**
 * Validates a CSRF token
 * 
 * @param token - The token to validate
 * @param sessionId - The session ID to validate against
 * @param maxAgeMs - Maximum age of token in milliseconds (default: 1 hour)
 * @returns True if token is valid
 */
export function validateCsrfToken(
  token: string,
  sessionId: string,
  maxAgeMs: number = 60 * 60 * 1000
): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [tokenSessionId, timestampStr, hash] = decoded.split(":")
    
    if (!tokenSessionId || !timestampStr || !hash) {
      return false
    }
    
    // Verify session ID matches
    if (tokenSessionId !== sessionId) {
      return false
    }
    
    // Verify token hasn't expired
    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return false
    }
    
    // Verify hash
    const expectedHash = simpleHash(`${tokenSessionId}:${timestampStr}${CSRF_SECRET}`)
    if (hash !== expectedHash) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Checks if a request has valid CSRF protection
 * 
 * For state-changing operations (POST, PUT, PATCH, DELETE),
 * requires a valid CSRF token in the header.
 * 
 * @param request - The incoming request
 * @param sessionId - The session ID to validate against
 * @returns True if request is protected or doesn't need protection
 */
export function checkCsrfProtection(
  request: NextRequest,
  sessionId?: string
): boolean {
  const method = request.method.toUpperCase()
  
  // Only require CSRF for state-changing operations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true
  }
  
  // If no session ID, can't validate
  if (!sessionId) {
    console.warn("CSRF check requested but no session ID provided")
    return false
  }
  
  const token = request.headers.get(CSRF_TOKEN_HEADER)
  
  if (!token) {
    console.warn("CSRF token missing from request")
    return false
  }
  
  return validateCsrfToken(token, sessionId)
}

/**
 * Simple hash function for CSRF tokens
 * In production, use crypto.createHmac or similar
 */
function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Validates request origin to prevent CSRF
 * 
 * @param request - The incoming request
 * @returns True if origin is valid
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const host = request.headers.get("host")
  
  // If no origin/referer, allow (could be same-origin or API client)
  if (!origin && !referer) {
    return true
  }
  
  // Check if origin matches host
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host === host) {
        return true
      }
    } catch {
      return false
    }
  }
  
  // Check if referer matches host
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.host === host) {
        return true
      }
    } catch {
      return false
    }
  }
  
  return false
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
}

/**
 * Validates that an ID is a valid UUID
 * 
 * @param id - The ID to validate
 * @returns True if valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Security configuration for API endpoints
 */
export interface SecurityConfig {
  rateLimit?: Partial<RateLimitConfig>
  requireCsrf?: boolean
  validateOrigin?: boolean
}

/**
 * Applies security checks to a request
 * 
 * @param request - The incoming request
 * @param config - Security configuration
 * @param sessionId - Optional session ID for CSRF validation
 * @returns Object with passed flag and error message if any
 */
export function applySecurityChecks(
  request: NextRequest,
  config: SecurityConfig = {},
  sessionId?: string
): { passed: boolean; error?: string; rateLimitInfo?: any } {
  // Check rate limit
  if (config.rateLimit !== false) {
    const rateLimitResult = checkRateLimit(request, config.rateLimit)
    
    if (rateLimitResult.limited) {
      return {
        passed: false,
        error: "Too many requests. Please try again later.",
        rateLimitInfo: rateLimitResult,
      }
    }
  }
  
  // Check origin
  if (config.validateOrigin) {
    if (!validateOrigin(request)) {
      return {
        passed: false,
        error: "Invalid request origin",
      }
    }
  }
  
  // Check CSRF
  if (config.requireCsrf) {
    if (!checkCsrfProtection(request, sessionId)) {
      return {
        passed: false,
        error: "Invalid or missing CSRF token",
      }
    }
  }
  
  return { passed: true }
}
