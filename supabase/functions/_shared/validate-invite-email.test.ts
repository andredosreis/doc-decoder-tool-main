import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  InviteEmailValidationError,
  validateAndNormalizeInviteEmail,
} from "./validate-invite-email.ts";

describe("validateAndNormalizeInviteEmail — Tier 2 (input validation, admin-invite-student)", () => {
  it("(1) empty string → InviteEmailValidationError", () => {
    assertThrows(
      () => validateAndNormalizeInviteEmail(""),
      InviteEmailValidationError,
      "obrigatório",
    );
  });

  it("(2) whitespace-only → InviteEmailValidationError", () => {
    assertThrows(
      () => validateAndNormalizeInviteEmail("   "),
      InviteEmailValidationError,
      "obrigatório",
    );
  });

  it("(3) string without '@' → InviteEmailValidationError", () => {
    assertThrows(
      () => validateAndNormalizeInviteEmail("notanemail"),
      InviteEmailValidationError,
      "@",
    );
  });

  it("(4) mixed-case email → lowercased in output", () => {
    const result = validateAndNormalizeInviteEmail("  Admin@EXAMPLE.com  ");
    assertEquals(result, "admin@example.com");
  });
});
