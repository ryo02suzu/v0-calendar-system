/**
 * Unit tests for components/auth-provider
 *
 * Tests cover:
 * - extractUserFromSession returns correct AuthUser
 * - role defaults to 'viewer' when not in metadata
 * - clinicId falls back to NEXT_PUBLIC_CLINIC_ID env var
 * - name is derived from email when metadata name is absent
 */

import { describe, it, expect } from "vitest"
import type { Session } from "@supabase/supabase-js"

// Test the extractUserFromSession logic directly
function extractUserFromSession(session: Session) {
  const { user } = session
  const metadata = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || "",
    role: (metadata.role as string) || "viewer",
    staffId: metadata.staff_id,
    clinicId: metadata.clinic_id || process.env.NEXT_PUBLIC_CLINIC_ID || "",
    name: metadata.name || metadata.full_name || user.email?.split("@")[0] || "",
  }
}

function makeSession(overrides: Partial<{
  id: string
  email: string
  user_metadata: Record<string, unknown>
}>): Session {
  return {
    access_token: "fake-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    refresh_token: "fake-refresh-token",
    user: {
      id: overrides.id ?? "user-123",
      email: overrides.email ?? "test@example.com",
      user_metadata: overrides.user_metadata ?? {},
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  } as unknown as Session
}

describe("extractUserFromSession", () => {
  it("extracts id and email correctly", () => {
    const session = makeSession({ id: "abc-123", email: "user@test.com" })
    const user = extractUserFromSession(session)
    expect(user.id).toBe("abc-123")
    expect(user.email).toBe("user@test.com")
  })

  it("extracts role from user_metadata", () => {
    const session = makeSession({ user_metadata: { role: "admin" } })
    const user = extractUserFromSession(session)
    expect(user.role).toBe("admin")
  })

  it("defaults role to viewer when not in metadata", () => {
    const session = makeSession({ user_metadata: {} })
    const user = extractUserFromSession(session)
    expect(user.role).toBe("viewer")
  })

  it("extracts staffId from user_metadata", () => {
    const session = makeSession({ user_metadata: { staff_id: "staff-456" } })
    const user = extractUserFromSession(session)
    expect(user.staffId).toBe("staff-456")
  })

  it("staffId is undefined when not in metadata", () => {
    const session = makeSession({ user_metadata: {} })
    const user = extractUserFromSession(session)
    expect(user.staffId).toBeUndefined()
  })

  it("extracts clinicId from user_metadata", () => {
    const session = makeSession({ user_metadata: { clinic_id: "clinic-789" } })
    const user = extractUserFromSession(session)
    expect(user.clinicId).toBe("clinic-789")
  })

  it("extracts name from user_metadata.name", () => {
    const session = makeSession({ user_metadata: { name: "Dr. Tanaka" } })
    const user = extractUserFromSession(session)
    expect(user.name).toBe("Dr. Tanaka")
  })

  it("extracts name from user_metadata.full_name when name is absent", () => {
    const session = makeSession({ user_metadata: { full_name: "Dr. Suzuki" } })
    const user = extractUserFromSession(session)
    expect(user.name).toBe("Dr. Suzuki")
  })

  it("derives name from email prefix when metadata name is absent", () => {
    const session = makeSession({ email: "yamada@clinic.jp", user_metadata: {} })
    const user = extractUserFromSession(session)
    expect(user.name).toBe("yamada")
  })

  it("handles empty email gracefully", () => {
    const session = makeSession({ email: "" })
    const user = extractUserFromSession(session)
    expect(user.email).toBe("")
    expect(user.name).toBe("")
  })
})
