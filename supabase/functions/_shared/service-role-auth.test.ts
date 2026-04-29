import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { isServiceRoleAuthorized } from "./service-role-auth.ts";

const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.service-role-fake-but-realistic-shape-256chars-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("isServiceRoleAuthorized — Tier 1 regression (send-purchase-confirmation auth)", () => {
  it("(1) rejects when Authorization header is null/missing", () => {
    assertEquals(isServiceRoleAuthorized(null, SERVICE_KEY), false);
  });

  it("(2) rejects when expectedKey is undefined or empty (fail-closed misconfiguration)", () => {
    // Misconfigured env var: SUPABASE_SERVICE_ROLE_KEY not set in production.
    // Function must reject ALL requests rather than match against empty/undefined.
    const validHeader = `Bearer ${SERVICE_KEY}`;
    assertEquals(isServiceRoleAuthorized(validHeader, undefined), false);
    assertEquals(isServiceRoleAuthorized(validHeader, ""), false);
  });

  it("(3) rejects when header is missing 'Bearer ' prefix (raw token without scheme)", () => {
    // A caller that passes the raw token without the auth scheme must fail —
    // protects against accidental passthrough that bypasses HTTP auth conventions.
    assertEquals(isServiceRoleAuthorized(SERVICE_KEY, SERVICE_KEY), false);
    assertEquals(
      isServiceRoleAuthorized(`bearer ${SERVICE_KEY}`, SERVICE_KEY),
      false,
      "scheme is case-sensitive; lowercase 'bearer' should fail",
    );
  });

  it("(4) rejects bearer with wrong token (truncated suffix is the trickiest case)", () => {
    // Truncated suffix: ensures the function isn't doing .startsWith() / substring.
    const truncated = SERVICE_KEY.slice(0, -10);
    assertEquals(
      isServiceRoleAuthorized(`Bearer ${truncated}`, SERVICE_KEY),
      false,
    );

    // Different but plausible-looking token (e.g. anon key).
    const anonKeyLike =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.anon-role-different-but-realistic-shape";
    assertEquals(
      isServiceRoleAuthorized(`Bearer ${anonKeyLike}`, SERVICE_KEY),
      false,
    );
  });

  it("(5) accepts exact 'Bearer <expectedKey>' (happy path)", () => {
    assertEquals(
      isServiceRoleAuthorized(`Bearer ${SERVICE_KEY}`, SERVICE_KEY),
      true,
    );
  });
});
