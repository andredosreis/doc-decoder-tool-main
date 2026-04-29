import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  NotificationValidationError,
  validateNotificationRequest,
} from "./validate-notification-request.ts";

describe("validateNotificationRequest — Tier 2 (input validation, send-notification)", () => {
  it("(1) missing userId → NotificationValidationError", () => {
    assertThrows(
      () =>
        validateNotificationRequest({
          title: "Hello",
          message: "World",
        }),
      NotificationValidationError,
      "userId",
    );
  });

  it("(2) whitespace-only userId → NotificationValidationError", () => {
    assertThrows(
      () =>
        validateNotificationRequest({
          userId: "   ",
          title: "Hello",
          message: "World",
        }),
      NotificationValidationError,
      "userId",
    );
  });

  it("(3) missing title → NotificationValidationError", () => {
    assertThrows(
      () =>
        validateNotificationRequest({
          userId: "user-uuid",
          message: "World",
        }),
      NotificationValidationError,
      "title",
    );
  });

  it("(4) missing message → NotificationValidationError", () => {
    assertThrows(
      () =>
        validateNotificationRequest({
          userId: "user-uuid",
          title: "Hello",
        }),
      NotificationValidationError,
      "message",
    );
  });

  it("(5) type outside enum → NotificationValidationError", () => {
    assertThrows(
      () =>
        validateNotificationRequest({
          userId: "user-uuid",
          title: "Hello",
          message: "World",
          type: "critical",
        }),
      NotificationValidationError,
      "critical",
    );
  });

  it("(6) valid request with all fields → returned with defaults", () => {
    const result = validateNotificationRequest({
      userId: "  user-uuid  ",
      title: "  Pagamento Aprovado  ",
      message: "  Seu curso está disponível  ",
      type: "success",
      actionUrl: "/student/product/123",
    });
    assertEquals(result.userId, "user-uuid");
    assertEquals(result.title, "Pagamento Aprovado");
    assertEquals(result.message, "Seu curso está disponível");
    assertEquals(result.type, "success");
    assertEquals(result.actionUrl, "/student/product/123");
  });
});
