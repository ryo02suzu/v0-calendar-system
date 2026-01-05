# Test Documentation

This directory contains comprehensive tests for the API endpoints in the application.

## Test Structure

```
tests/
├── setup.ts                          # Test environment setup
├── api/                              # Unit tests for API routes
│   └── notifications-read.test.ts    # Tests for /api/notifications/[id]/read
└── e2e/                              # End-to-end integration tests
    └── notifications-read.e2e.test.ts # E2E tests for notifications
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Coverage

### `/api/notifications/[id]/read` Endpoint

**Unit Tests (29 tests):**
- ✅ Successful notification marking as read (PATCH and POST)
- ✅ Missing notification ID parameter validation
- ✅ Invalid notification ID format validation (empty string, whitespace)
- ✅ Missing params object handling
- ✅ Notification not found (404) handling
- ✅ Database operation failure (500) handling
- ✅ Error code propagation
- ✅ Various UUID format acceptance
- ✅ Special characters in ID handling
- ✅ POST method delegation to PATCH
- ✅ Concurrent request handling
- ✅ Whitespace handling in IDs
- ✅ Very long ID handling
- ✅ Detailed error logging
- ✅ Sensitive information protection in error responses

**E2E Tests (13 tests):**
- ✅ Integration test documentation (mock mode)
- ✅ Expected flow documentation
- ✅ Error response scenarios documentation
- ✅ Authentication requirements documentation
- ✅ Rate limiting expectations documentation
- ✅ Complete request/response cycle documentation
- ✅ Performance metrics documentation
- ✅ Concurrent request handling documentation
- ✅ Data integrity requirements documentation
- ✅ Database transaction requirements documentation

## Test Environment

Tests use Vitest as the testing framework with the following configuration:
- **Environment**: Node.js
- **Globals**: Enabled for easier test writing
- **Setup**: Automatic environment variable configuration
- **Mocking**: Database operations are mocked in unit tests

## Environment Variables for Testing

The test setup automatically provides default values for required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Default test URL
- `SUPABASE_SERVICE_ROLE_KEY`: Default test key
- `NODE_ENV`: Set to 'test'

## Integration Testing

To run integration tests against a real server:

```bash
TEST_MODE=integration TEST_BASE_URL=http://localhost:3000 npm test
```

Note: Integration tests require a running Next.js server and a properly configured Supabase instance.

## Key Testing Principles

1. **Isolation**: Unit tests mock external dependencies (database, etc.)
2. **Comprehensive Coverage**: Tests cover happy paths, error cases, and edge cases
3. **Security**: Validates that sensitive information is not exposed in error responses
4. **Logging**: Ensures proper error logging for debugging
5. **Performance**: Documents expected response times and concurrent request handling

## Adding New Tests

When adding new API endpoints or modifying existing ones:

1. Create a new test file in `tests/api/` for unit tests
2. Mock all external dependencies
3. Test all error scenarios and edge cases
4. Verify error messages don't expose sensitive information
5. Ensure proper logging is in place
6. Add integration tests in `tests/e2e/` if needed

## Debugging Tests

If tests fail:

1. Check the error message and stack trace
2. Ensure environment variables are set correctly
3. Verify mocks are properly configured
4. Run tests in watch mode to iterate quickly: `npm run test:watch`
5. Use the UI for better visualization: `npm run test:ui`

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Fast execution (< 1 second)
- No external dependencies in unit tests
- Clear error messages
- Exit code 0 on success, non-zero on failure
