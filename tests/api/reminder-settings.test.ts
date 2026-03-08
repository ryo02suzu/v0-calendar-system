/**
 * Unit tests for /api/reminder-settings endpoint
 *
 * Tests cover:
 * - GET: Successful retrieval of reminder settings
 * - GET: Database error handling
 * - PUT: Successful update of reminder settings
 * - PUT: Database error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { GET, PUT } from "@/app/api/reminder-settings/route"

vi.mock("@/lib/db", () => ({
  getReminderSettings: vi.fn(),
  updateReminderSettings: vi.fn(),
}))

vi.mock("@/lib/security/api-security", () => ({
  applySecurityChecks: vi.fn().mockReturnValue({ passed: true }),
}))

vi.mock("@/lib/auth/server", () => ({
  getServerAuth: vi.fn().mockResolvedValue({
    authenticated: true,
    user: { id: "test-user", email: "test@example.com", role: "admin", clinicId: "test-clinic" },
  }),
  checkServerPermission: vi.fn().mockReturnValue(true),
}))

import { getReminderSettings, updateReminderSettings } from "@/lib/db"

const mockGetReminderSettings = getReminderSettings as ReturnType<typeof vi.fn>
const mockUpdateReminderSettings = updateReminderSettings as ReturnType<typeof vi.fn>

const mockSettings = {
  id: "00000000-0000-0000-0000-000000000001",
  clinic_id: "00000000-0000-0000-0000-000000000002",
  enabled: true,
  remind_hours_before: 24,
  send_sms: true,
  send_email: true,
  sms_template: "【{{clinic_name}}】\n{{patient_name}}様\n予約日時：{{date}} {{time}}",
  email_template: "{{patient_name}}様\n予約リマインダーです。",
}

describe("GET /api/reminder-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return reminder settings", async () => {
    mockGetReminderSettings.mockResolvedValue(mockSettings)

    const request = new NextRequest("http://localhost:3000/api/reminder-settings")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual(mockSettings)
    expect(mockGetReminderSettings).toHaveBeenCalledOnce()
  })

  it("should return 500 on database error", async () => {
    mockGetReminderSettings.mockRejectedValue(new Error("DB error"))

    const request = new NextRequest("http://localhost:3000/api/reminder-settings")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeTruthy()
  })
})

describe("PUT /api/reminder-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should update and return reminder settings", async () => {
    const updatedSettings = { ...mockSettings, remind_hours_before: 48 }
    mockUpdateReminderSettings.mockResolvedValue(updatedSettings)

    const request = new NextRequest("http://localhost:3000/api/reminder-settings", {
      method: "PUT",
      body: JSON.stringify({ remind_hours_before: 48 }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.remind_hours_before).toBe(48)
    expect(mockUpdateReminderSettings).toHaveBeenCalledWith({ remind_hours_before: 48 })
  })

  it("should return 500 on database error", async () => {
    mockUpdateReminderSettings.mockRejectedValue(new Error("DB error"))

    const request = new NextRequest("http://localhost:3000/api/reminder-settings", {
      method: "PUT",
      body: JSON.stringify({ enabled: false }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeTruthy()
  })
})
