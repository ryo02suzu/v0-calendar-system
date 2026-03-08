/**
 * Unit tests for hooks/use-realtime
 *
 * Tests cover:
 * - useRealtimeAppointments: subscribes to appointments table changes
 * - useRealtimeAppointments: skips when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
 * - useRealtimeNotifications: subscribes to notifications table changes
 * - useRealtimeNotifications: skips when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
 * - Both hooks: clean up channel on unmount
 *
 * NOTE: React hooks are tested by mocking useEffect/useRef to run synchronously
 * in the node test environment (no DOM required).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Capture the last useEffect callback so we can invoke it manually.
let capturedEffect: (() => (() => void) | void) | null = null

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()
  return {
    ...actual,
    useRef: vi.fn((init: unknown) => ({ current: init })),
    useEffect: vi.fn((fn: () => (() => void) | void) => {
      capturedEffect = fn
    }),
  }
})

// Use vi.hoisted so the mock values are available when vi.mock is hoisted.
const { mockChannel, mockRemoveChannel } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  const mockRemoveChannel = vi.fn()
  return { mockChannel, mockRemoveChannel }
})

vi.mock("@/lib/supabase/client", () => ({
  supabaseClient: {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
  },
}))

import { supabaseClient } from "@/lib/supabase/client"
import { useRealtimeAppointments, useRealtimeNotifications } from "@/hooks/use-realtime"

const mockChannelFactory = supabaseClient.channel as ReturnType<typeof vi.fn>

describe("useRealtimeAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedEffect = null
    mockChannelFactory.mockReturnValue(mockChannel)
    mockChannel.on.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockReturnValue(mockChannel)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should subscribe to appointments table when anon key is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

    useRealtimeAppointments(vi.fn())
    expect(capturedEffect).not.toBeNull()

    capturedEffect!()

    expect(mockChannelFactory).toHaveBeenCalledWith("appointments-changes")
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "appointments" },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it("should not subscribe when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    useRealtimeAppointments(vi.fn())
    capturedEffect?.()

    expect(mockChannelFactory).not.toHaveBeenCalled()
  })

  it("should remove channel on cleanup", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

    useRealtimeAppointments(vi.fn())
    const cleanup = capturedEffect!() as () => void

    cleanup()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })
})

describe("useRealtimeNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedEffect = null
    mockChannelFactory.mockReturnValue(mockChannel)
    mockChannel.on.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockReturnValue(mockChannel)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should subscribe to notifications table when anon key is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

    useRealtimeNotifications(vi.fn())
    expect(capturedEffect).not.toBeNull()

    capturedEffect!()

    expect(mockChannelFactory).toHaveBeenCalledWith("notifications-changes")
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it("should not subscribe when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    useRealtimeNotifications(vi.fn())
    capturedEffect?.()

    expect(mockChannelFactory).not.toHaveBeenCalled()
  })

  it("should remove channel on cleanup", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

    useRealtimeNotifications(vi.fn())
    const cleanup = capturedEffect!() as () => void

    cleanup()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })
})
