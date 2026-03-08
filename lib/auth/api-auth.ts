import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { ROLE_PERMISSIONS, type UserRole, type Permission } from "@/lib/types/auth"

export async function getAuthUser() {
  // Supabase 環境変数がない場合は Basic Auth モードとしてスキップ
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      id: "basic-auth",
      email: "",
      role: "admin" as UserRole,
      staffId: undefined as string | undefined,
      clinicId: process.env.NEXT_PUBLIC_CLINIC_ID || "",
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return {
    id: user.id,
    email: user.email || "",
    role: (user.user_metadata?.role as UserRole) || "viewer",
    staffId: user.user_metadata?.staff_id as string | undefined,
    clinicId: (user.user_metadata?.clinic_id as string) || process.env.NEXT_PUBLIC_CLINIC_ID || "",
  }
}

export function checkPermission(role: UserRole, resource: keyof Permission, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return (perms[resource] as Record<string, boolean>)?.[action] ?? false
}

export function unauthorizedResponse(message = "認証が必要です") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = "権限がありません") {
  return NextResponse.json({ error: message }, { status: 403 })
}
