import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  CheckoutValidationError,
  validateCheckoutRequest,
} from "./validate-checkout-request.ts";

describe("validateCheckoutRequest — Tier 2 (input validation, create-checkout)", () => {
  it("(1) missing email → CheckoutValidationError", () => {
    assertThrows(
      () => validateCheckoutRequest({ plan: "pro" }),
      CheckoutValidationError,
      "email",
    );
  });

  it("(2) invalid plan 'free' → CheckoutValidationError", () => {
    assertThrows(
      () =>
        validateCheckoutRequest({ plan: "free", email: "a@b.com" }),
      CheckoutValidationError,
      "free",
    );
  });

  it("(3) plan = '__proto__' → CheckoutValidationError (prototype pollution blocked)", () => {
    assertThrows(
      () =>
        validateCheckoutRequest({ plan: "__proto__", email: "a@b.com" }),
      CheckoutValidationError,
      "__proto__",
    );
  });

  it("(4) plan = 'constructor' → CheckoutValidationError (prototype pollution blocked)", () => {
    assertThrows(
      () =>
        validateCheckoutRequest({ plan: "constructor", email: "a@b.com" }),
      CheckoutValidationError,
      "constructor",
    );
  });

  it("(5) valid request → normalizes email and returns typed plan", () => {
    const result = validateCheckoutRequest({
      plan: "pro",
      email: "  buyer@example.com  ",
      fullName: "Ana Silva",
    });
    assertEquals(result.plan, "pro");
    assertEquals(result.email, "buyer@example.com");
    assertEquals(result.fullName, "Ana Silva");
  });
});
