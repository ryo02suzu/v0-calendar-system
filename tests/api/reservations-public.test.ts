/**
 * Unit tests for GET /api/reservations/public/[id]
 *
 * Tests cover:
 * - GET: Successful retrieval of public appointment details
 * - GET: 404 when appointment not found
 * - GET: 500 on database error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/api/reservations/public/[id]/route"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock("@/lib/db/client", () => ({
  CLINIC_ID: "00000000-0000-0000-0000-000000000001",
}))

vi.mock("@/lib/security/api-security", () => ({
  applySecurityChecks: vi.fn().mockReturnValue({ success: true }),
}))

import { supabaseAdmin } from "@/lib/supabase/admin"

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>

const mockAppointment = {
  id: "apt-00000001",
  date: "2025-04-01",
  start_time: "10:00",
  end_time: "10:30",
  treatment_type: "定期検診",
  status: "confirmed",
  notes: null,
  patient: { name: "田中 太郎", phone: "090-1234-5678", email: null },
  staff: { name: "山田 先生" },
}

function makeRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/reservations/public/${id}`)
}

function makeChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
}

describe("GET /api/reservations/public/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return appointment details for a valid id", async () => {
    mockFrom.mockReturnValue(makeChain({ data: mockAppointment, error: null }))

    const response = await GET(makeRequest("apt-00000001"), {
      params: { id: "apt-00000001" },
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.appointment.id).toBe("apt-00000001")
    expect(data.appointment.patient.name).toBe("田中 太郎")
    expect(data.appointment.staff.name).toBe("山田 先生")
  })

  it("should return 404 when appointment is not found", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { code: "PGRST116" } }))

    const response = await GET(makeRequest("nonexistent-id"), {
      params: { id: "nonexistent-id" },
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBeTruthy()
  })

  it("should return 500 on unexpected database error", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("Unexpected DB error")
    })

    const response = await GET(makeRequest("apt-00000001"), {
      params: { id: "apt-00000001" },
    })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeTruthy()
  })
})
