import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@^1.0.0";
import {
  CERTIFICATE_NUMBER_PATTERN,
  CERTIFICATE_THRESHOLD_PERCENTAGE,
  checkCertificateEligibility,
  generateCertNumber,
} from "./certificate-eligibility.ts";

describe("checkCertificateEligibility — Tier 1 regression (generate-certificate)", () => {
  it("(1) product with zero modules → ineligible with PRODUCT_HAS_NO_MODULES", () => {
    const result = checkCertificateEligibility(0, 0);
    assertEquals(result.eligible, false);
    assertEquals(result.reason, "PRODUCT_HAS_NO_MODULES");
    assertEquals(result.completionPercentage, 0);
  });

  it("(2) progress below threshold → ineligible with PROGRESS_BELOW_THRESHOLD", () => {
    // 4 of 5 modules completed = 80%, below default 100% threshold
    const result = checkCertificateEligibility(5, 4);
    assertEquals(result.eligible, false);
    assertEquals(result.reason, "PROGRESS_BELOW_THRESHOLD");
    assertEquals(result.completionPercentage, 80);
  });

  it("(3) at exactly the threshold → eligible (boundary)", () => {
    // Default threshold is 100%; 5/5 modules → exactly 100%
    const atThreshold = checkCertificateEligibility(5, 5);
    assertEquals(atThreshold.eligible, true);
    assertEquals(atThreshold.completionPercentage, 100);
    assertEquals(atThreshold.reason, undefined);

    // FDD-004 threshold of 90; 9/10 modules → exactly 90%
    const atFddThreshold = checkCertificateEligibility(10, 9, 90);
    assertEquals(atFddThreshold.eligible, true);
    assertEquals(atFddThreshold.completionPercentage, 90);
  });

  it("(4) just below threshold → ineligible (boundary, off-by-one regression guard)", () => {
    // 89.9% with FDD-004 threshold of 90 → ineligible
    // (1000 modules, 899 completed = 89.9%)
    const justBelow = checkCertificateEligibility(1000, 899, 90);
    assertEquals(justBelow.eligible, false);
    assertEquals(justBelow.reason, "PROGRESS_BELOW_THRESHOLD");
  });

  it("(5) over-counted progress (defensive) clamps and remains consistent", () => {
    // Negative completed count should be treated as 0 (no negative percentage)
    const negative = checkCertificateEligibility(5, -3);
    assertEquals(negative.completionPercentage, 0);
    assertEquals(negative.eligible, false);
  });

  it("(6) generateCertNumber returns CERT-YYYY-XXXXXX format with deterministic year", () => {
    const fixedDate = new Date("2026-04-29T12:00:00.000Z");
    const cert = generateCertNumber(fixedDate);
    assertMatch(cert, CERTIFICATE_NUMBER_PATTERN);
    assert(cert.startsWith("CERT-2026-"), `expected year 2026, got ${cert}`);
    assertEquals(cert.length, "CERT-2026-XXXXXX".length);

    // Multiple invocations produce the same format (sanity; collision is
    // the C8 risk documented in TEST-GAP-ANALYSIS — fix lives in FDD-004 PR 2)
    for (let i = 0; i < 5; i++) {
      const generated = generateCertNumber(fixedDate);
      assertMatch(generated, CERTIFICATE_NUMBER_PATTERN);
    }

    // Sanity: the constant matches the threshold currently in use by v0
    assertEquals(CERTIFICATE_THRESHOLD_PERCENTAGE, 100);
  });
});
