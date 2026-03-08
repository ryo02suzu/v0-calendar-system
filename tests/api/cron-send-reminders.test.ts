/**
 * Unit tests for GET /api/cron/send-reminders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// Mock all dependencies
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock("@/lib/db", () => ({
  getReminderSettings: vi.fn(),
}))

vi.mock("@/lib/db/client", () => ({
  CLINIC_ID: "00000000-0000-0000-0000-000000000001",
}))

import { supabaseAdmin } from "@/lib/supabase/admin"
import { getReminderSettings } from "@/lib/db"
import { GET } from "@/app/api/cron/send-reminders/route"

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>
const mockGetReminderSettings = getReminderSettings as ReturnType<typeof vi.fn>

function makeCronRequest() {
  return new NextRequest("http://localhost:3000/api/cron/send-reminders")
}

describe("GET /api/cron/send-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure no CRON_SECRET is set for tests
    delete process.env.CRON_SECRET
  })
  afterEach(() => { vi.restoreAllMocks() })

  it("should return 200 with 0 processed when reminders are disabled", async () => {
    mockGetReminderSettings.mockResolvedValue({
      enabled: false,
      remind_hours_before: 24,
      send_sms: true,
      send_email: true,
    })

    const response = await GET(makeCronRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.processed).toBe(0)
    expect(data.message).toContain("無効")
  })

  it("should return 200 with 0 processed when no appointments found", async () => {
    mockGetReminderSettings.mockResolvedValue({
      enabled: true,
      remind_hours_before: 24,
      send_sms: true,
      send_email: false,
    })

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      neq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const response = await GET(makeCronRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.processed).toBe(0)
  })

  it("should return 401 when CRON_SECRET is set and header is missing", async () => {
    process.env.CRON_SECRET = "secret-token"

    const response = await GET(makeCronRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Unauthorized")

    delete process.env.CRON_SECRET
  })

  it("should return 200 when CRON_SECRET matches", async () => {
    process.env.CRON_SECRET = "secret-token"
    mockGetReminderSettings.mockResolvedValue({ enabled: false })

    const request = new NextRequest("http://localhost:3000/api/cron/send-reminders", {
      headers: { authorization: "Bearer secret-token" },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    delete process.env.CRON_SECRET
  })
})
