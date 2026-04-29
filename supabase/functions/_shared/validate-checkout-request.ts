/**
 * Validação pura da request para `create-checkout`.
 *
 * Protege contra:
 *   - plan inválido (não mapeado em PRICE_IDS)
 *   - prototype pollution via plan = '__proto__' ou 'constructor' —
 *     o lookup em PRICE_IDS usa indexação de objecto; um valor controlado
 *     pelo atacante poderia aceder a propriedades herdadas se não validado.
 *   - email ausente
 *
 * Comportamento crítico (Tier 2 tests):
 *   - plan '__proto__' → CheckoutValidationError (não chega ao PRICE_IDS lookup)
 *   - plan 'constructor' → CheckoutValidationError
 *   - plan fora do enum → CheckoutValidationError
 *   - email ausente ou whitespace-only → CheckoutValidationError
 *   - request válido → ValidatedCheckoutRequest
 */

export type CheckoutPlan = "iniciante" | "pro" | "enterprise";

const VALID_PLANS: ReadonlySet<string> = new Set([
  "iniciante",
  "pro",
  "enterprise",
]);

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export interface ValidatedCheckoutRequest {
  plan: CheckoutPlan;
  email: string;
  fullName?: string;
}

export function validateCheckoutRequest(
  raw: Record<string, unknown>,
): ValidatedCheckoutRequest {
  if (!raw.email || typeof raw.email !== "string" || !raw.email.trim()) {
    throw new CheckoutValidationError("Missing required field: email");
  }

  // VALID_PLANS.has() is safe against prototype pollution because Set.has()
  // does not walk the prototype chain. The typeof guard ensures plan is a
  // primitive string (not an object like `{ toString: () => "iniciante" }`).
  if (
    !raw.plan ||
    typeof raw.plan !== "string" ||
    !VALID_PLANS.has(raw.plan)
  ) {
    throw new CheckoutValidationError(
      `Invalid plan: "${raw.plan}". Must be one of: ${[...VALID_PLANS].join(", ")}`,
    );
  }

  return {
    plan: raw.plan as CheckoutPlan,
    email: (raw.email as string).trim(),
    fullName: raw.fullName as string | undefined,
  };
}
