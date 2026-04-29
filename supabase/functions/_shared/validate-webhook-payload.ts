/**
 * Validação pura do payload recebido em `webhook-payment`.
 *
 * Extraído do handler para ser testável sem I/O. Verifica campos
 * obrigatórios e invariantes antes de qualquer escrita na DB.
 *
 * Comportamento crítico (Tier 2 tests):
 *   - transaction_id ausente ou whitespace-only → WebhookValidationError
 *   - customer_email ausente ou whitespace-only → WebhookValidationError
 *   - status fora do enum → WebhookValidationError
 *   - amount negativo é aceite sem validação de range (v1.0)
 *   - customer_email é trimmed mas não lowercase (o handler normaliza mais tarde)
 */

export type WebhookStatus = "approved" | "pending" | "cancelled" | "refunded";

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "approved",
  "pending",
  "cancelled",
  "refunded",
]);

export class WebhookValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookValidationError";
  }
}

export interface ValidatedWebhookPayload {
  transaction_id: string;
  customer_email: string;
  status: WebhookStatus;
  amount?: number;
  customer_name?: string;
  product_id?: string;
  external_product_id?: string;
}

export function validateWebhookPayload(
  // deno-lint-ignore no-explicit-any
  raw: Record<string, any>,
): ValidatedWebhookPayload {
  if (
    !raw.transaction_id ||
    typeof raw.transaction_id !== "string" ||
    !raw.transaction_id.trim()
  ) {
    throw new WebhookValidationError(
      "Missing required field: transaction_id",
    );
  }

  if (
    !raw.customer_email ||
    typeof raw.customer_email !== "string" ||
    !raw.customer_email.trim()
  ) {
    throw new WebhookValidationError(
      "Missing required field: customer_email",
    );
  }

  const status = raw.status ?? "pending";
  if (!VALID_STATUSES.has(status)) {
    throw new WebhookValidationError(
      `Invalid status: "${status}". Must be one of: ${[...VALID_STATUSES].join(", ")}`,
    );
  }

  return {
    transaction_id: raw.transaction_id.trim(),
    customer_email: raw.customer_email.trim(),
    status: status as WebhookStatus,
    amount: raw.amount !== undefined ? Number(raw.amount) : undefined,
    customer_name: raw.customer_name,
    product_id: raw.product_id,
    external_product_id: raw.external_product_id,
  };
}
