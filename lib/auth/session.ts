import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ROLE_PERMISSIONS, type UserRole, type Permission } from "@/lib/types/auth"
import { NextResponse } from "next/server"

export async function getAuthUser() {
  // Supabase 環境変数がない場合は開発環境向けフォールバックとしてアクセスを許可
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      id: "dev-fallback",
      email: "",
      role: "admin" as UserRole,
      staffId: undefined,
      clinicId: process.env.NEXT_PUBLIC_CLINIC_ID || "",
      name: "",
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const metadata = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || "",
    role: (metadata.role as UserRole) || "viewer",
    staffId: metadata.staff_id as string | undefined,
    clinicId: (metadata.clinic_id as string) || process.env.NEXT_PUBLIC_CLINIC_ID || "",
    name: (metadata.name as string) || (metadata.full_name as string) || user.email?.split("@")[0] || "",
  }
}

export async function requireAuth() {
  const user = await getAuthUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user, error: null }
}

export async function requirePermission(resource: keyof Permission, action: string) {
  const { user, error } = await requireAuth()
  if (error) return { user: null, error }

  const permissions = ROLE_PERMISSIONS[user!.role]
  const resourcePerms = permissions[resource]
  const hasAccess = (resourcePerms as Record<string, boolean>)?.[action] ?? false

  if (!hasAccess) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { user, error: null }
}
