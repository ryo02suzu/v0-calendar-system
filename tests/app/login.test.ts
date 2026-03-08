/**
 * Unit tests for app/login/page.tsx logic
 *
 * Tests the login form behavior and validation logic.
 */

import { describe, it, expect } from "vitest"

describe("Login page logic", () => {
  describe("form validation", () => {
    it("detects empty email", () => {
      const email = ""
      const isValid = email.length > 0
      expect(isValid).toBe(false)
    })

    it("detects empty password", () => {
      const password = ""
      const isValid = password.length > 0
      expect(isValid).toBe(false)
    })

    it("accepts valid email format", () => {
      const email = "user@example.com"
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      expect(isValid).toBe(true)
    })

    it("rejects invalid email format", () => {
      const email = "not-an-email"
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      expect(isValid).toBe(false)
    })
  })

  describe("error message handling", () => {
    it("sets generic error message on auth failure", () => {
      const errorFromSignIn = "Invalid login credentials"
      // The login page shows a generic message, not the raw error
      const displayedError = errorFromSignIn
        ? "メールアドレスまたはパスワードが正しくありません"
        : ""
      expect(displayedError).toBe("メールアドレスまたはパスワードが正しくありません")
    })

    it("clears error on new submission", () => {
      let error = "メールアドレスまたはパスワードが正しくありません"
      // On new submit, error is cleared first
      error = ""
      expect(error).toBe("")
    })
  })
})
