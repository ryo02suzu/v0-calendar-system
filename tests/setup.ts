// Test setup file
import { beforeAll } from 'vitest'

beforeAll(() => {
  // Set up test environment variables with clearly fake values
  // These are never used in actual API calls during unit tests (we mock everything)
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fake-test-project.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-test-service-role-key-for-unit-tests-only'
  process.env.NODE_ENV = 'test'
})
