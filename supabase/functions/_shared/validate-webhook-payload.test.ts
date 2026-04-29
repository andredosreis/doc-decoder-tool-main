import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  validateWebhookPayload,
  WebhookValidationError,
} from "./validate-webhook-payload.ts";

describe("validateWebhookPayload — Tier 2 (input validation)", () => {
  it("(1) missing transaction_id → WebhookValidationError", () => {
    assertThrows(
      () =>
        validateWebhookPayload({
          customer_email: "a@b.com",
          status: "approved",
        }),
      WebhookValidationError,
      "transaction_id",
    );
  });

  it("(2) whitespace-only transaction_id → WebhookValidationError", () => {
    assertThrows(
      () =>
        validateWebhookPayload({
          transaction_id: "   ",
          customer_email: "a@b.com",
          status: "approved",
        }),
      WebhookValidationError,
      "transaction_id",
    );
  });

  it("(3) missing customer_email → WebhookValidationError", () => {
    assertThrows(
      () => validateWebhookPayload({ transaction_id: "txn-001", status: "approved" }),
      WebhookValidationError,
      "customer_email",
    );
  });

  it("(4) whitespace-only customer_email → WebhookValidationError", () => {
    assertThrows(
      () =>
        validateWebhookPayload({
          transaction_id: "txn-001",
          customer_email: "\t\n ",
          status: "approved",
        }),
      WebhookValidationError,
      "customer_email",
    );
  });

  it("(5) status 'declined' (outside enum) → WebhookValidationError", () => {
    assertThrows(
      () =>
        validateWebhookPayload({
          transaction_id: "txn-001",
          customer_email: "a@b.com",
          status: "declined",
        }),
      WebhookValidationError,
      "declined",
    );
  });

  it("(6) status 'chargeback' (outside enum) → WebhookValidationError", () => {
    assertThrows(
      () =>
        validateWebhookPayload({
          transaction_id: "txn-001",
          customer_email: "a@b.com",
          status: "chargeback",
        }),
      WebhookValidationError,
      "chargeback",
    );
  });

  it("(7) negative amount is accepted — no amount range validation in v1.0", () => {
    const result = validateWebhookPayload({
      transaction_id: "txn-001",
      customer_email: "a@b.com",
      status: "approved",
      amount: -50,
    });
    assertEquals(result.amount, -50);
  });

  it("(8) valid minimal payload (required fields only) → normalizes and returns", () => {
    const result = validateWebhookPayload({
      transaction_id: "  txn-001  ",
      customer_email: "  a@b.com  ",
      status: "pending",
    });
    assertEquals(result.transaction_id, "txn-001");
    assertEquals(result.customer_email, "a@b.com");
    assertEquals(result.status, "pending");
    assertEquals(result.amount, undefined);
  });

  it("(9) valid full payload with both identifiers → accepted", () => {
    const result = validateWebhookPayload({
      transaction_id: "txn-001",
      customer_email: "buyer@example.com",
      status: "approved",
      amount: 99.9,
      customer_name: "Buyer Name",
      product_id: "00000000-0000-0000-0000-000000000001",
      external_product_id: "ext-prod-42",
    });
    assertEquals(result.status, "approved");
    assertEquals(result.amount, 99.9);
    assertEquals(result.product_id, "00000000-0000-0000-0000-000000000001");
    assertEquals(result.external_product_id, "ext-prod-42");
  });
});
