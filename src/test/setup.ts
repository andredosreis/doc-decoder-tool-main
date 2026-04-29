import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "./handlers"

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }))

// Reset any request handlers added during a test, so they don't affect other tests.
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished.
afterAll(() => server.close())
