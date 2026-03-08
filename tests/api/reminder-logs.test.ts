/**
 * Unit tests for GET /api/reminder-logs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/api/reminder-logs/route"

vi.mock("@/lib/db", () => ({
  getReminderLogs: vi.fn(),
}))

vi.mock("@/lib/security/api-security", () => ({
  applySecurityChecks: vi.fn().mockReturnValue({ success: true }),
}))

import { getReminderLogs } from "@/lib/db"

const mockGetReminderLogs = getReminderLogs as ReturnType<typeof vi.fn>

describe("GET /api/reminder-logs", () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it("should return reminder logs with default limit", async () => {
    const mockLogs = [
      {
        id: "1",
        appointment_id: "apt-1",
        method: "sms",
        status: "sent",
        sent_at: new Date().toISOString(),
        patients: { name: "田中 太郎" },
      },
    ]
    mockGetReminderLogs.mockResolvedValue(mockLogs)

    const request = new NextRequest("http://localhost:3000/api/reminder-logs")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(mockGetReminderLogs).toHaveBeenCalledWith(20)
  })

  it("should respect the limit query parameter (max 100)", async () => {
    mockGetReminderLogs.mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/reminder-logs?limit=50")
    await GET(request)

    expect(mockGetReminderLogs).toHaveBeenCalledWith(50)
  })

  it("should cap limit at 100", async () => {
    mockGetReminderLogs.mockResolvedValue([])

    const request = new NextRequest("http://localhost:3000/api/reminder-logs?limit=999")
    await GET(request)

    expect(mockGetReminderLogs).toHaveBeenCalledWith(100)
  })

  it("should return 500 on database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockGetReminderLogs.mockRejectedValue(new Error("DB error"))

    const request = new NextRequest("http://localhost:3000/api/reminder-logs")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeTruthy()
  })
})
