"use client"

import { useAuth } from "@/components/auth-provider"
import { ROLE_PERMISSIONS, type Permission, type UserRole } from "@/lib/types/auth"

export function usePermission() {
  const { user } = useAuth()

  const role: UserRole = user?.role || "viewer"
  const permissions: Permission = ROLE_PERMISSIONS[role]

  const hasPermission = (resource: keyof Permission, action: string): boolean => {
    const resourcePerms = permissions[resource]
    return (resourcePerms as Record<string, boolean>)?.[action] ?? false
  }

  return { permissions, hasPermission, role }
}
