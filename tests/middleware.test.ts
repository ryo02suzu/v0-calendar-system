/**
 * Unit tests for middleware.ts
 *
 * Tests cover:
 * - Public paths bypass authentication
 * - Basic Auth mode: valid credentials succeed
 * - Basic Auth mode: missing credentials return 401
 * - Basic Auth mode: wrong credentials return 401
 * - Basic Auth mode: unconfigured credentials allow access
 * - Supabase Auth mode: redirects to /login when not authenticated
 * - Supabase Auth mode: allows access when authenticated
 *
 * Supabase Auth mode is enabled when NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are set.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// Mock @supabase/supabase-js before importing middleware
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@supabase/supabase-js"
import { middleware } from "@/middleware"

const mockCreateClient = createClient as ReturnType<typeof vi.fn>

function makeRequest(pathname: string, options: { authorization?: string; cookies?: Record<string, string> } = {}) {
  const url = `https://example.com${pathname}`
  const headers: Record<string, string> = {}
  if (options.authorization) {
    headers["authorization"] = options.authorization
  }

  const req = new NextRequest(url, { headers })

  // Add cookies if provided
  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value)
    }
  }

  return req
}

function encodeBasicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

describe("middleware", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.SUPABASE_AUTH_ENABLED
    delete process.env.DASHBOARD_BASIC_AUTH_USER
    delete process.env.DASHBOARD_BASIC_AUTH_PASSWORD
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe("public paths", () => {
    it("allows /reserve without authentication", async () => {
      const req = makeRequest("/reserve")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /login without authentication", async () => {
      const req = makeRequest("/login")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /api/availability without authentication", async () => {
      const req = makeRequest("/api/availability")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /api/services without authentication", async () => {
      const req = makeRequest("/api/services")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /manifest.json without authentication", async () => {
      const req = makeRequest("/manifest.json")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /sw.js without authentication", async () => {
      const req = makeRequest("/sw.js")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("allows /icons/icon-192x192.png without authentication", async () => {
      const req = makeRequest("/icons/icon-192x192.png")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })
  })

  describe("Basic Auth mode (NEXT_PUBLIC_SUPABASE_URL not set)", () => {
    it("allows access when credentials are not configured", async () => {
      const req = makeRequest("/dashboard")
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("returns 401 when credentials are configured but not provided", async () => {
      process.env.DASHBOARD_BASIC_AUTH_USER = "admin"
      process.env.DASHBOARD_BASIC_AUTH_PASSWORD = "secret"

      const req = makeRequest("/dashboard")
      const res = await middleware(req)
      expect(res.status).toBe(401)
    })

    it("returns 401 when wrong credentials are provided", async () => {
      process.env.DASHBOARD_BASIC_AUTH_USER = "admin"
      process.env.DASHBOARD_BASIC_AUTH_PASSWORD = "secret"

      const req = makeRequest("/dashboard", {
        authorization: encodeBasicAuth("admin", "wrong"),
      })
      const res = await middleware(req)
      expect(res.status).toBe(401)
    })

    it("allows access with correct credentials", async () => {
      process.env.DASHBOARD_BASIC_AUTH_USER = "admin"
      process.env.DASHBOARD_BASIC_AUTH_PASSWORD = "secret"

      const req = makeRequest("/dashboard", {
        authorization: encodeBasicAuth("admin", "secret"),
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(401)
    })

    it("WWW-Authenticate header contains Basic realm", async () => {
      process.env.DASHBOARD_BASIC_AUTH_USER = "admin"
      process.env.DASHBOARD_BASIC_AUTH_PASSWORD = "secret"

      const req = makeRequest("/dashboard")
      const res = await middleware(req)
      expect(res.headers.get("WWW-Authenticate")).toContain("Basic realm=")
    })
  })

  describe("Supabase Auth mode (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set)", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
    })

    it("redirects to /login when not authenticated", async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      })

      const req = makeRequest("/dashboard")
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toContain("/login")
    })

    it("includes redirect param in login URL", async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      })

      const req = makeRequest("/dashboard")
      const res = await middleware(req)
      expect(res.headers.get("location")).toContain("redirect=%2Fdashboard")
    })

    it("allows access with valid Bearer token", async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
        },
      })

      const req = makeRequest("/dashboard", {
        authorization: "Bearer valid-token",
      })
      const res = await middleware(req)
      expect(res.status).not.toBe(307)
    })
  })
})
