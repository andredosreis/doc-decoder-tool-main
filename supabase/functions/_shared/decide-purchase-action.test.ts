import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  decidePurchaseAction,
  type ExistingPurchase,
} from "./decide-purchase-action.ts";

const FROZEN_NOW = "2026-04-29T12:00:00.000Z";
const now = () => FROZEN_NOW;

describe("decidePurchaseAction — Tier 1 regression (webhook idempotency)", () => {
  it("(1) new transaction with status=approved → INSERT, fires approval email, sets approved_at", () => {
    const decision = decidePurchaseAction(
      { payload: { status: "approved", amount: 99.9 }, existing: null },
      now,
    );
    assertEquals(decision.action, "INSERT");
    assertEquals(decision.existingId, undefined);
    assertEquals(decision.status, "approved");
    assertEquals(decision.amountPaid, 99.9);
    assertEquals(decision.approvedAt, FROZEN_NOW);
    assertEquals(decision.shouldFireApprovalEmail, true);
  });

  it("(2) new transaction with status=pending → INSERT, NO approval email, approved_at null", () => {
    const decision = decidePurchaseAction(
      { payload: { status: "pending", amount: 50 }, existing: null },
      now,
    );
    assertEquals(decision.action, "INSERT");
    assertEquals(decision.approvedAt, null);
    assertEquals(decision.shouldFireApprovalEmail, false);
  });

  it("(3) existing pending → approved → UPDATE existing, fires approval email (transition)", () => {
    const existing: ExistingPurchase = { id: "purchase-1", status: "pending" };
    const decision = decidePurchaseAction(
      { payload: { status: "approved", amount: 100 }, existing },
      now,
    );
    assertEquals(decision.action, "UPDATE");
    assertEquals(decision.existingId, "purchase-1");
    assertEquals(decision.approvedAt, FROZEN_NOW);
    assertEquals(decision.shouldFireApprovalEmail, true);
  });

  it("(4) existing approved → approved (replay) → UPDATE, NO approval email re-fired", () => {
    // Critical idempotency property: webhook senders retry on non-2xx; replays
    // of an already-approved transaction must NOT re-send the customer email.
    const existing: ExistingPurchase = { id: "purchase-1", status: "approved" };
    const decision = decidePurchaseAction(
      { payload: { status: "approved", amount: 100 }, existing },
      now,
    );
    assertEquals(decision.action, "UPDATE");
    assertEquals(decision.shouldFireApprovalEmail, false);
  });

  it("(5) existing approved → cancelled → UPDATE, NO approval email", () => {
    // Status downgrade: customer cancelled or refunded. Email/notification
    // for approval must not fire. Note: current implementation also nulls
    // approved_at on downgrade (known issue, documented in helper docstring;
    // separate fix). This test only asserts the email-gating contract.
    const existing: ExistingPurchase = { id: "purchase-1", status: "approved" };
    const decision = decidePurchaseAction(
      { payload: { status: "cancelled", amount: 0 }, existing },
      now,
    );
    assertEquals(decision.action, "UPDATE");
    assertEquals(decision.shouldFireApprovalEmail, false);
  });

  it("(6) existing approved → refunded → UPDATE, NO approval email", () => {
    const existing: ExistingPurchase = { id: "purchase-1", status: "approved" };
    const decision = decidePurchaseAction(
      { payload: { status: "refunded", amount: 100 }, existing },
      now,
    );
    assertEquals(decision.action, "UPDATE");
    assertEquals(decision.shouldFireApprovalEmail, false);
  });
});
