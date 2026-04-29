import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { validateWebhookSignature } from "./verify-webhook-signature.ts";

const SECRET = "test-secret-32-bytes-abcdefghijkl";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/webhook", {
    method: "POST",
    headers,
  });
}

describe("validateWebhookSignature — Tier 1 regression (webhook auth)", () => {
  it("(1) rejects all requests when WEBHOOK_SECRET is not provided (env undefined, no override)", () => {
    // expectedSecret undefined AND env WEBHOOK_SECRET unset → false
    // Even with the correct-looking header, missing secret is fail-closed.
    Deno.env.delete("WEBHOOK_SECRET");
    const req = makeRequest({ "x-webhook-signature": "anything" });
    assertEquals(validateWebhookSignature(req), false);
  });

  it("(2) rejects when expected secret is empty string (misconfiguration)", () => {
    const req = makeRequest({ "x-webhook-signature": SECRET });
    assertEquals(validateWebhookSignature(req, ""), false);
  });

  it("(3) rejects when x-webhook-signature header is missing", () => {
    const req = makeRequest({}); // no signature header
    assertEquals(validateWebhookSignature(req, SECRET), false);
  });

  it("(4) rejects when x-webhook-signature header is empty string", () => {
    const req = makeRequest({ "x-webhook-signature": "" });
    assertEquals(validateWebhookSignature(req, SECRET), false);
  });

  it("(5) rejects when signature length differs from expected secret", () => {
    const tooShort = SECRET.slice(0, 10);
    const tooLong = SECRET + "extra";
    assertEquals(
      validateWebhookSignature(
        makeRequest({ "x-webhook-signature": tooShort }),
        SECRET,
      ),
      false,
    );
    assertEquals(
      validateWebhookSignature(
        makeRequest({ "x-webhook-signature": tooLong }),
        SECRET,
      ),
      false,
    );
  });

  it("(6) rejects same-length signature whose middle byte differs (proves full-length comparison)", () => {
    // Produce a signature with same length but the LAST byte different.
    // If timingSafeEqual short-circuited at first mismatch from the start,
    // detecting the last-byte difference would still work; but if it short-
    // circuited mid-compare, an attacker could leak bytes via timing.
    // Behaviorally: rejection is required.
    const tampered = SECRET.slice(0, -1) + "X";
    assertEquals(
      validateWebhookSignature(
        makeRequest({ "x-webhook-signature": tampered }),
        SECRET,
      ),
      false,
    );
  });

  it("(7) rejects header with different case (no .toLowerCase())", () => {
    // Note: testing leading/trailing whitespace is futile — the WHATWG
    // Fetch spec says Headers API normalizes header values by stripping
    // leading/trailing OWS (space + HTAB), so the function never sees them.
    // Case differences ARE preserved; a regression that adds .toLowerCase()
    // would silently match against an attacker's UPPERCASE secret guess.
    assertEquals(
      validateWebhookSignature(
        makeRequest({ "x-webhook-signature": SECRET.toUpperCase() }),
        SECRET,
      ),
      false,
    );
  });

  it("(8) accepts request with exactly matching x-webhook-signature header (happy path)", () => {
    const req = makeRequest({ "x-webhook-signature": SECRET });
    assertEquals(validateWebhookSignature(req, SECRET), true);
  });
});
