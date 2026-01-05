/**
 * Unit tests for lib/supabase/admin.ts environment variable validation
 * 
 * Tests cover:
 * - URL trimming and validation
 * - Missing environment variables
 * - Invalid URL formats
 * - Build-time vs runtime behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('lib/supabase/admin URL validation', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear module cache to test fresh imports
    vi.resetModules()
    // Reset environment
    process.env = { ...originalEnv }
    delete process.env.NEXT_PHASE
    process.env.NODE_ENV = 'test'
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('URL trimming', () => {
    it('should trim whitespace from NEXT_PUBLIC_SUPABASE_URL', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://test-project.supabase.co  '
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      // Dynamic import to get fresh module with new env vars
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      
      // Should not throw an error
      expect(supabaseAdmin).toBeDefined()
    })

    it('should trim whitespace from SUPABASE_SERVICE_ROLE_KEY', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = '  test-key  '

      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      
      expect(supabaseAdmin).toBeDefined()
    })

    it('should handle URLs with spaces by failing validation', async () => {
      // This is the specific case from the problem statement
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pfsxoyvbuclbtrowjfln. supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Invalid NEXT_PUBLIC_SUPABASE_URL/)
    })
  })

  describe('Missing environment variables', () => {
    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing at runtime', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Missing required environment variables/)
    })

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing at runtime', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Missing required environment variables/)
    })

    it('should use placeholder values during build time', async () => {
      process.env.NEXT_PHASE = 'phase-production-build'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      
      // Should not throw, should use placeholders
      expect(supabaseAdmin).toBeDefined()
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing environment variables during build')
      )
    })
  })

  describe('Invalid URL formats', () => {
    it('should reject URLs without protocol', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-project.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Invalid NEXT_PUBLIC_SUPABASE_URL/)
    })

    it('should reject completely invalid URLs', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not a url at all'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Invalid NEXT_PUBLIC_SUPABASE_URL/)
    })

    it('should reject URLs that are just whitespace after trimming', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '   '
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      await expect(async () => {
        await import('@/lib/supabase/admin')
      }).rejects.toThrow(/Missing required environment variables/)
    })
  })

  describe('Valid URL formats', () => {
    it('should accept standard https Supabase URLs', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      
      expect(supabaseAdmin).toBeDefined()
    })

    it('should accept http URLs (for local development)', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      
      expect(supabaseAdmin).toBeDefined()
    })

    it('should accept URLs with different domain structures', async () => {
      const validUrls = [
        'https://abc123.supabase.co',
        'https://my-project.supabase.com',
        'https://localhost:3000',
        'http://127.0.0.1:54321',
      ]

      for (const url of validUrls) {
        vi.resetModules()
        process.env.NEXT_PUBLIC_SUPABASE_URL = url
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

        const { supabaseAdmin } = await import('@/lib/supabase/admin')
        expect(supabaseAdmin).toBeDefined()
      }
    })
  })

  describe('Error messages', () => {
    it('should provide helpful error message for invalid URL', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid url with spaces.com'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      try {
        await import('@/lib/supabase/admin')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('Invalid NEXT_PUBLIC_SUPABASE_URL')
        expect(errorMessage).toContain('without spaces')
      }
    })

    it('should include the invalid URL in the error message', async () => {
      const invalidUrl = 'not-a-url'
      process.env.NEXT_PUBLIC_SUPABASE_URL = invalidUrl
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      try {
        await import('@/lib/supabase/admin')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).toContain(invalidUrl)
      }
    })
  })
})
