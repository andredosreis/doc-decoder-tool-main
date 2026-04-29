import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { buildCheckoutMetadata } from "./checkout-metadata.ts";

describe("buildCheckoutMetadata — regression for Bug 2 (password in Stripe metadata)", () => {
  it("returns email, full_name, plan", () => {
    const meta = buildCheckoutMetadata({
      email: "user@example.com",
      fullName: "Foo Bar",
      plan: "pro",
    });
    assertEquals(meta.email, "user@example.com");
    assertEquals(meta.full_name, "Foo Bar");
    assertEquals(meta.plan, "pro");
  });

  it("does NOT include 'password' key (PCI/LGPD compliance)", () => {
    const meta = buildCheckoutMetadata({
      email: "user@example.com",
      fullName: "Foo",
      plan: "iniciante",
    });
    assert(
      !Object.hasOwn(meta, "password"),
      "Bug 2 regression: password key reappeared in Stripe metadata",
    );
  });

  it("rejects sneaky password input (any-cast does not leak)", () => {
    const sneakInput = {
      email: "user@example.com",
      fullName: "Foo",
      plan: "pro",
      password: "MySecret123",
    };
    // deno-lint-ignore no-explicit-any
    const meta = buildCheckoutMetadata(sneakInput as any);
    assert(
      !Object.hasOwn(meta, "password"),
      "Bug 2 regression: password leaked through any-cast input",
    );
  });

  it("defaults full_name to empty string when fullName is undefined", () => {
    const meta = buildCheckoutMetadata({
      email: "user@example.com",
      plan: "pro",
    });
    assertEquals(meta.full_name, "");
  });

  it("returned values are all strings (Stripe metadata constraint)", () => {
    const meta = buildCheckoutMetadata({
      email: "user@example.com",
      fullName: "Foo",
      plan: "pro",
    });
    for (const value of Object.values(meta)) {
      assertEquals(typeof value, "string");
    }
  });
});
