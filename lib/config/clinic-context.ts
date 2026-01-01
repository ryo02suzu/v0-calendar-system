/**
 * Clinic Context Management
 * 
 * This module provides multi-tenant support by managing clinic context.
 * It abstracts the clinic_id resolution for SaaS-ready architecture.
 */

import type { ClinicSettings } from "@/lib/types"
import { supabaseAdmin } from "@/lib/supabase/admin"

/**
 * Configuration for clinic context resolution
 */
export interface ClinicContextConfig {
  /**
   * Default clinic ID to use when no context is provided
   * This is used for single-tenant deployments
   */
  defaultClinicId?: string
  
  /**
   * Whether to enforce clinic context validation
   * When true, operations without valid clinic context will fail
   */
  requireClinicContext?: boolean
  
  /**
   * Custom clinic resolver function
   * Use this to implement custom logic for determining clinic context
   * (e.g., from subdomain, authentication token, etc.)
   */
  resolver?: (request?: any) => Promise<string | null>
}

/**
 * Global clinic context configuration
 * Can be customized via environment variables or dynamic configuration
 */
const config: ClinicContextConfig = {
  defaultClinicId: process.env.DEFAULT_CLINIC_ID || "00000000-0000-0000-0000-000000000001",
  requireClinicContext: process.env.REQUIRE_CLINIC_CONTEXT === "true",
  resolver: undefined,
}

/**
 * Sets the global clinic context configuration
 */
export function setClinicContextConfig(newConfig: Partial<ClinicContextConfig>) {
  Object.assign(config, newConfig)
}

/**
 * Gets the current clinic context configuration
 */
export function getClinicContextConfig(): Readonly<ClinicContextConfig> {
  return config
}

/**
 * Resolves the clinic ID for the current operation
 * 
 * @param request - Optional request object for context resolution
 * @returns The clinic ID to use for the operation
 * @throws Error if clinic context is required but not available
 */
export async function resolveClinicId(request?: any): Promise<string> {
  // Use custom resolver if configured
  if (config.resolver) {
    const clinicId = await config.resolver(request)
    if (clinicId) {
      return clinicId
    }
  }
  
  // Fall back to default clinic ID
  if (config.defaultClinicId) {
    return config.defaultClinicId
  }
  
  // If no clinic context is available and it's required, throw error
  if (config.requireClinicContext) {
    throw new Error(
      "Clinic context is required but not available. " +
      "Please configure DEFAULT_CLINIC_ID or implement a custom resolver."
    )
  }
  
  // Last resort: use hardcoded default
  return "00000000-0000-0000-0000-000000000001"
}

/**
 * Cache for clinic settings to reduce database queries
 */
const clinicSettingsCache = new Map<string, { data: ClinicSettings; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Gets clinic settings for the specified clinic
 * Results are cached for performance
 * 
 * @param clinicId - The clinic ID
 * @returns The clinic settings or null if not found
 */
export async function getClinicSettings(clinicId: string): Promise<ClinicSettings | null> {
  // Check cache
  const cached = clinicSettingsCache.get(clinicId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Fetch from database
  try {
    const { data, error } = await supabaseAdmin
      .from("clinic_settings")
      .select("*")
      .eq("clinic_id", clinicId)
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, return default
        return {
          clinic_id: clinicId,
          chairs_count: 3,
          booking_advance_days: 60,
          booking_buffer_minutes: 15,
        }
      }
      throw error
    }
    
    // Update cache
    clinicSettingsCache.set(clinicId, {
      data: data as ClinicSettings,
      timestamp: Date.now(),
    })
    
    return data as ClinicSettings
  } catch (error) {
    console.error("Error fetching clinic settings:", error)
    return null
  }
}

/**
 * Clears the clinic settings cache for a specific clinic or all clinics
 * 
 * @param clinicId - Optional clinic ID to clear. If not provided, clears all cache.
 */
export function clearClinicSettingsCache(clinicId?: string) {
  if (clinicId) {
    clinicSettingsCache.delete(clinicId)
  } else {
    clinicSettingsCache.clear()
  }
}

/**
 * Validates that a clinic exists in the database
 * 
 * @param clinicId - The clinic ID to validate
 * @returns True if the clinic exists, false otherwise
 */
export async function validateClinicExists(clinicId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinics")
      .select("id")
      .eq("id", clinicId)
      .single()
    
    return !error && data !== null
  } catch {
    return false
  }
}
