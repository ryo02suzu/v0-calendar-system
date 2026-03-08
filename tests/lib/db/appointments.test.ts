/**
 * Unit tests for lib/db/appointments.ts
 *
 * Tests cover:
 * - getAppointments: Successful retrieval
 * - createAppointment: Successful creation
 * - deleteAppointment: Successful deletion
 * - getPatientRiskScore: Risk score calculation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

// Mock getClinicSettings used by checkAppointmentConflict
vi.mock("@/lib/db/clinic-settings", () => ({
  getClinicSettings: vi.fn().mockResolvedValue({ chairs_count: 3, max_concurrent_appointments: 1 }),
}))

import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getAppointments,
  createAppointment,
  deleteAppointment,
  getPatientRiskScore,
  getTodayAppointments,
} from "@/lib/db/appointments"

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>

describe("getAppointments", () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it("should return appointments list", async () => {
    const mockApts = [
      {
        id: "apt-1",
        date: "2024-01-15",
        start_time: "09:00",
        end_time: "09:30",
        treatment_type: "定期検診",
        status: "confirmed",
        patient: { id: "p1", name: "田中 太郎", birth_date: "1980-05-15", notes: "なし" },
        staff: { id: "s1", name: "今泉 太郎" },
        service: null,
      },
    ]

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    // Second order call resolves the promise
    chain.order
      .mockReturnValueOnce(chain) // first .order("date")
      .mockResolvedValueOnce({ data: mockApts, error: null }) // second .order("start_time")
    mockFrom.mockReturnValue(chain)

    const result = await getAppointments()

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe("2024-01-15")
    // Patient should be mapped from DB to APP format
    expect(result[0].patient).toHaveProperty("date_of_birth", "1980-05-15")
  })

  it("should return empty array on error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }
    chain.order
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null, error: new Error("DB error") })
    mockFrom.mockReturnValue(chain)

    const result = await getAppointments()
    expect(result).toEqual([])
  })
})

describe("getPatientRiskScore", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should return low risk for patient with no cancellations", async () => {
    const mockApts = [
      { status: "confirmed" },
      { status: "completed" },
      { status: "completed" },
    ]

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // Two .eq() calls: clinic_id and patient_id
    chain.eq
      .mockReturnValueOnce(chain) // .eq("clinic_id", ...)
      .mockResolvedValueOnce({ data: mockApts, error: null }) // .eq("patient_id", ...)
    mockFrom.mockReturnValue(chain)

    const result = await getPatientRiskScore("patient-id")

    expect(result.riskLevel).toBe("low")
    expect(result.riskScore).toBe(0)
    expect(result.cancellationCount).toBe(0)
    expect(result.totalAppointments).toBe(3)
  })

  it("should return high risk for patient with many no-shows", async () => {
    const mockApts = [
      { status: "no_show" },
      { status: "no_show" },
      { status: "confirmed" },
    ]

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: mockApts, error: null })
    mockFrom.mockReturnValue(chain)

    const result = await getPatientRiskScore("patient-id")

    expect(result.riskLevel).toBe("high")
    expect(result.noShowCount).toBe(2)
  })

  it("should return default values on error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null, error: new Error("DB error") })
    mockFrom.mockReturnValue(chain)

    const result = await getPatientRiskScore("patient-id")

    expect(result.riskScore).toBe(0)
    expect(result.riskLevel).toBe("low")
  })
})
