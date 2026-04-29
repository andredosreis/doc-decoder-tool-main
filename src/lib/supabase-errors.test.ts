import { describe, expect, it } from "vitest"
import { isSupabaseError } from "./supabase-errors"

describe("isSupabaseError", () => {
  it("returns true for Supabase error with matching code", () => {
    const err = { code: "23505", message: "duplicate key value" }
    expect(isSupabaseError(err, "23505")).toBe(true)
  })

  it("returns false for Supabase error with non-matching code", () => {
    const err = { code: "23505", message: "duplicate key value" }
    expect(isSupabaseError(err, "PGRST116")).toBe(false)
  })

  it("returns false for plain Error instance", () => {
    expect(isSupabaseError(new Error("boom"), "23505")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isSupabaseError(null, "23505")).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isSupabaseError(undefined, "23505")).toBe(false)
  })

  it("returns false for string", () => {
    expect(isSupabaseError("error message", "23505")).toBe(false)
  })

  it("returns false for object without code property", () => {
    expect(isSupabaseError({ message: "x" }, "23505")).toBe(false)
  })

  it("recognizes RLS policy violation code 42501", () => {
    const rlsError = {
      code: "42501",
      message: "new row violates row-level security policy",
    }
    expect(isSupabaseError(rlsError, "42501")).toBe(true)
  })
})
