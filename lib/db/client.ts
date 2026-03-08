/**
 * Supabase admin client and shared constants for DB modules.
 * Re-exports supabaseAdmin from the admin module and exposes CLINIC_ID.
 */
export { supabaseAdmin } from "@/lib/supabase/admin"
export const CLINIC_ID = process.env.DEFAULT_CLINIC_ID || "00000000-0000-0000-0000-000000000001"
