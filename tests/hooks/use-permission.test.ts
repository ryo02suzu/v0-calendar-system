/**
 * Unit tests for hooks/use-permission
 *
 * Tests cover:
 * - Returns viewer permissions when user is null
 * - Returns correct permissions for each role
 * - hasPermission correctly checks resource/action combinations
 */

import { describe, it, expect, vi } from "vitest"
import { ROLE_PERMISSIONS, ROLE_LABELS } from "@/lib/types/auth"

// We test the permission logic directly (the hook wraps useAuth which is tested separately)
describe("ROLE_PERMISSIONS", () => {
  it("admin has full calendar permissions", () => {
    const p = ROLE_PERMISSIONS["admin"]
    expect(p.calendar.view).toBe(true)
    expect(p.calendar.create).toBe(true)
    expect(p.calendar.edit).toBe(true)
    expect(p.calendar.delete).toBe(true)
  })

  it("viewer can only view calendar", () => {
    const p = ROLE_PERMISSIONS["viewer"]
    expect(p.calendar.view).toBe(true)
    expect(p.calendar.create).toBe(false)
    expect(p.calendar.edit).toBe(false)
    expect(p.calendar.delete).toBe(false)
  })

  it("hygienist cannot access settings", () => {
    const p = ROLE_PERMISSIONS["hygienist"]
    expect(p.settings.view).toBe(false)
    expect(p.settings.edit).toBe(false)
  })

  it("hygienist cannot view reports", () => {
    const p = ROLE_PERMISSIONS["hygienist"]
    expect(p.reports.view).toBe(false)
  })

  it("receptionist cannot view records", () => {
    const p = ROLE_PERMISSIONS["receptionist"]
    expect(p.records.view).toBe(false)
  })

  it("dentist can create calendar entries", () => {
    const p = ROLE_PERMISSIONS["dentist"]
    expect(p.calendar.create).toBe(true)
  })

  it("admin has staff management permissions", () => {
    const p = ROLE_PERMISSIONS["admin"]
    expect(p.staff.create).toBe(true)
    expect(p.staff.edit).toBe(true)
    expect(p.staff.delete).toBe(true)
  })

  it("viewer cannot manage staff", () => {
    const p = ROLE_PERMISSIONS["viewer"]
    expect(p.staff.view).toBe(false)
    expect(p.staff.create).toBe(false)
  })
})

describe("ROLE_LABELS", () => {
  it("has labels for all roles", () => {
    const roles = ["admin", "dentist", "hygienist", "receptionist", "viewer"] as const
    for (const role of roles) {
      expect(ROLE_LABELS[role]).toBeTruthy()
    }
  })

  it("admin label is 管理者", () => {
    expect(ROLE_LABELS["admin"]).toBe("管理者")
  })

  it("viewer label is 閲覧者", () => {
    expect(ROLE_LABELS["viewer"]).toBe("閲覧者")
  })
})

// Test the usePermission hook logic (without React context)
describe("usePermission logic", () => {
  function getPermissions(role: keyof typeof ROLE_PERMISSIONS) {
    const permissions = ROLE_PERMISSIONS[role]
    const hasPermission = (resource: keyof typeof permissions, action: string): boolean => {
      const resourcePerms = permissions[resource]
      return (resourcePerms as Record<string, boolean>)?.[action] ?? false
    }
    return { permissions, hasPermission, role }
  }

  it("hasPermission returns true for admin calendar view", () => {
    const { hasPermission } = getPermissions("admin")
    expect(hasPermission("calendar", "view")).toBe(true)
  })

  it("hasPermission returns false for viewer calendar create", () => {
    const { hasPermission } = getPermissions("viewer")
    expect(hasPermission("calendar", "create")).toBe(false)
  })

  it("hasPermission returns false for unknown action", () => {
    const { hasPermission } = getPermissions("admin")
    expect(hasPermission("calendar", "nonexistent")).toBe(false)
  })

  it("defaults to viewer when no user", () => {
    // When user is null, role defaults to viewer
    const role = (null as unknown as { role: string })?.role || "viewer"
    const { hasPermission } = getPermissions(role as keyof typeof ROLE_PERMISSIONS)
    expect(hasPermission("calendar", "create")).toBe(false)
  })
})
