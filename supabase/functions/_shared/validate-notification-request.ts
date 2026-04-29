/**
 * Validação pura da request para `send-notification`.
 *
 * A function usa service-role e não filtra por RLS; valida campos antes
 * de qualquer escrita para evitar erros de constraint na DB e evitar que
 * callers possam inserir notificações com dados inválidos.
 *
 * Comportamento crítico (Tier 2 tests):
 *   - userId ausente → NotificationValidationError
 *   - title ausente ou whitespace-only → NotificationValidationError
 *   - message ausente ou whitespace-only → NotificationValidationError
 *   - type fora do enum → NotificationValidationError
 *   - type omitido → defaults to 'info' (aceite)
 */

export type NotificationType = "info" | "success" | "warning" | "error";

const VALID_TYPES: ReadonlySet<string> = new Set([
  "info",
  "success",
  "warning",
  "error",
]);

export class NotificationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationValidationError";
  }
}

export interface ValidatedNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
}

export function validateNotificationRequest(
  raw: Record<string, unknown>,
): ValidatedNotificationRequest {
  if (!raw.userId || typeof raw.userId !== "string" || !raw.userId.trim()) {
    throw new NotificationValidationError("Missing required field: userId");
  }

  if (!raw.title || typeof raw.title !== "string" || !raw.title.trim()) {
    throw new NotificationValidationError("Missing required field: title");
  }

  if (!raw.message || typeof raw.message !== "string" || !raw.message.trim()) {
    throw new NotificationValidationError("Missing required field: message");
  }

  const type = raw.type ?? "info";
  if (!VALID_TYPES.has(type as string)) {
    throw new NotificationValidationError(
      `Invalid type: "${type}". Must be one of: ${[...VALID_TYPES].join(", ")}`,
    );
  }

  return {
    userId: (raw.userId as string).trim(),
    title: (raw.title as string).trim(),
    message: (raw.message as string).trim(),
    type: type as NotificationType,
    actionUrl: raw.actionUrl as string | undefined,
  };
}
