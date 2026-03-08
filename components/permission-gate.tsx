"use client"
import { usePermission } from "@/hooks/use-permission"
import type { Permission } from "@/lib/types/auth"

interface PermissionGateProps {
  resource: keyof Permission
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ resource, action, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermission()
  return hasPermission(resource, action) ? <>{children}</> : <>{fallback}</>
}
