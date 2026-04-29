import { describe, expect, it } from "vitest"
import { validatePasswordForm } from "./password-validation"

describe("validatePasswordForm — Tier 2 (input validation, Settings)", () => {
  it("(1) new_password !== confirm_password → PASSWORDS_DO_NOT_MATCH", () => {
    expect(
      validatePasswordForm({
        current_password: "oldpass",
        new_password: "newpass1",
        confirm_password: "newpass2",
      }),
    ).toBe("PASSWORDS_DO_NOT_MATCH")
  })

  it("(2) new_password.length < 6 → PASSWORD_TOO_SHORT", () => {
    expect(
      validatePasswordForm({
        current_password: "oldpass",
        new_password: "12345",
        confirm_password: "12345",
      }),
    ).toBe("PASSWORD_TOO_SHORT")
  })

  it("(3) password exactly 6 chars → valid (null)", () => {
    expect(
      validatePasswordForm({
        current_password: "oldpass",
        new_password: "123456",
        confirm_password: "123456",
      }),
    ).toBeNull()
  })

  it("(4) empty new_password → PASSWORD_TOO_SHORT (length 0 < 6)", () => {
    expect(
      validatePasswordForm({
        current_password: "oldpass",
        new_password: "",
        confirm_password: "",
      }),
    ).toBe("PASSWORD_TOO_SHORT")
  })

  it("(5) current === new is NOT blocked — documents known gap in Settings.tsx", () => {
    // Bug: Settings.tsx does not reject current_password === new_password.
    // This test pins the CURRENT behavior so a future fix is a deliberate change.
    expect(
      validatePasswordForm({
        current_password: "samepass",
        new_password: "samepass",
        confirm_password: "samepass",
      }),
    ).toBeNull()
  })

  it("(6) match check takes priority over length check", () => {
    // A mismatch with short passwords returns PASSWORDS_DO_NOT_MATCH, not TOO_SHORT
    expect(
      validatePasswordForm({
        current_password: "old",
        new_password: "abc",
        confirm_password: "xyz",
      }),
    ).toBe("PASSWORDS_DO_NOT_MATCH")
  })

  it("(7) long matching passwords → valid", () => {
    expect(
      validatePasswordForm({
        current_password: "oldPassword123",
        new_password: "superSecureNewPassword!",
        confirm_password: "superSecureNewPassword!",
      }),
    ).toBeNull()
  })
})
