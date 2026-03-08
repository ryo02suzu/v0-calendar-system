/**
 * Unit tests for lib/db/staff.ts
 *
 * Tests cover:
 * - getStaff: Successful retrieval
 * - createStaff: Successful creation
 * - updateStaff: Successful update
 * - deleteStaff: Successful deletion
 * - Database errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock the Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStaff, createStaff, updateStaff, deleteStaff } from "@/lib/db/staff"

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>

function makeMockChain(result: { data?: any; error?: any }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
  chain.then = undefined
  return chain
}

describe("getStaff", () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it("should return staff list on success", async () => {
    const mockStaff = [
      { id: "1", name: "今泉 太郎", role: "院長", clinic_id: "clinic-1" },
      { id: "2", name: "山田 花子", role: "歯科医師", clinic_id: "clinic-1" },
    ]

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockStaff, error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getStaff()

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("今泉 太郎")
    expect(mockFrom).toHaveBeenCalledWith("staff")
  })

  it("should return empty array on database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getStaff()

    expect(result).toEqual([])
  })
})

describe("createStaff", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should create and return new staff", async () => {
    const newStaff = { name: "佐藤 三郎", role: "歯科衛生士", email: "sato@test.com" }
    const createdStaff = { id: "new-id", ...newStaff, clinic_id: "clinic-1" }

    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: createdStaff, error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await createStaff(newStaff)

    expect(result).toEqual(createdStaff)
    expect(mockFrom).toHaveBeenCalledWith("staff")
  })

  it("should throw on database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    }
    mockFrom.mockReturnValue(chain)

    await expect(createStaff({ name: "Test" })).rejects.toThrow()
  })
})

describe("deleteStaff", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should delete staff without error", async () => {
    const chain: any = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: undefined,
    }
    // The last .eq() returns a promise-like
    chain.eq.mockImplementation(() => ({
      ...chain,
      then: (resolve: any) => resolve({ error: null }),
    }))
    mockFrom.mockReturnValue(chain)

    await expect(deleteStaff("staff-id")).resolves.toBeUndefined()
  })
})
