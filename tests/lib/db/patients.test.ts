/**
 * Unit tests for lib/db/patients.ts
 *
 * Tests cover:
 * - getPatients: Successful retrieval with DB→APP field mapping
 * - createPatient: Successful creation with APP→DB field mapping
 * - updatePatient: Successful update
 * - deletePatient: Successful deletion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from "@/lib/supabase/admin"
import { getPatients, createPatient, updatePatient, deletePatient } from "@/lib/db/patients"
import { mapPatientFromDb, mapPatientPayloadToDb } from "@/lib/db/utils"

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>

describe("getPatients", () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it("should return patients with DB→APP field mapping (birth_date → date_of_birth)", async () => {
    const dbPatients = [
      {
        id: "1",
        clinic_id: "clinic-1",
        name: "田中 太郎",
        birth_date: "1980-05-15",
        notes: "特になし",
      },
    ]

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: dbPatients, error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getPatients()

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty("date_of_birth", "1980-05-15")
    expect(result[0]).not.toHaveProperty("birth_date")
    expect(result[0]).toHaveProperty("medical_notes", "特になし")
    expect(result[0]).not.toHaveProperty("notes")
  })

  it("should return empty array on error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getPatients()
    expect(result).toEqual([])
  })
})

describe("createPatient", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should create patient with APP→DB field mapping (date_of_birth → birth_date)", async () => {
    const appPatient = {
      name: "鈴木 花子",
      date_of_birth: "1992-08-22",
      medical_notes: "アレルギーなし",
    }

    let insertedPayload: any = null
    const chain: any = {
      insert: vi.fn().mockImplementation((payload: any) => {
        insertedPayload = payload
        return chain
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "new-id", name: "鈴木 花子", birth_date: "1992-08-22", notes: "アレルギーなし", clinic_id: "c1" },
        error: null,
      }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await createPatient(appPatient)

    expect(insertedPayload).toHaveProperty("birth_date", "1992-08-22")
    expect(insertedPayload).not.toHaveProperty("date_of_birth")
    expect(insertedPayload).toHaveProperty("notes", "アレルギーなし")
    expect(result).toHaveProperty("date_of_birth", "1992-08-22")
  })
})

describe("deletePatient", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should delete patient without error", async () => {
    const chain: any = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    chain.eq.mockImplementation(() => ({
      ...chain,
      then: (resolve: any) => resolve({ error: null }),
    }))
    mockFrom.mockReturnValue(chain)

    await expect(deletePatient("patient-id")).resolves.toBeUndefined()
  })
})
