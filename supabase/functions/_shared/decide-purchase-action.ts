/**
 * Pure decision logic para o fluxo de idempotência do `webhook-payment`.
 *
 * Dado o payload recebido e a linha existente (se houver) em `purchases`,
 * decide:
 *   - INSERT (nova compra) ou UPDATE (compra já existente sob mesmo
 *     `external_transaction_id`)
 *   - se deve disparar o e-mail de confirmação + notificação (apenas na
 *     **primeira** transição para `approved`; replays subsequentes não
 *     re-enviam)
 *
 * Mantida pure (sem I/O) para que os testes Tier 1 cubram todas as transições
 * de status sem precisar mock do cliente Supabase nem de fetch.
 *
 * NOTA SOBRE `approvedAt` (bug conhecido, não fixado nesta ronda):
 * O comportamento actual nula `approved_at` sempre que `status !== 'approved'`,
 * o que perde o timestamp original em downgrade `approved → cancelled`. Esta
 * função preserva o comportamento (devolve `null`) para manter parity com
 * `webhook-payment/index.ts` enquanto o fix não landa. Quando o fix vier, o
 * teste `(5)` em `decide-purchase-action.test.ts` precisa ser actualizado para
 * exigir preservação do `approved_at` original.
 */

export type PurchaseStatus = "pending" | "approved" | "cancelled" | "refunded";

export interface ExistingPurchase {
  id: string;
  status: PurchaseStatus;
}

export interface DecisionPayload {
  status: PurchaseStatus;
  amount?: number;
}

export interface DecisionInput {
  payload: DecisionPayload;
  existing: ExistingPurchase | null;
}

export interface PurchaseDecision {
  action: "INSERT" | "UPDATE";
  /** Set apenas quando action === "UPDATE" */
  existingId?: string;
  status: PurchaseStatus;
  amountPaid?: number;
  approvedAt: string | null;
  /** True apenas na **primeira** transição para approved (idempotência) */
  shouldFireApprovalEmail: boolean;
}

export function decidePurchaseAction(
  input: DecisionInput,
  now: () => string = () => new Date().toISOString(),
): PurchaseDecision {
  const isApproved = input.payload.status === "approved";
  const wasApprovedBefore = input.existing?.status === "approved";
  const becomingApprovedNow = isApproved && !wasApprovedBefore;

  return {
    action: input.existing ? "UPDATE" : "INSERT",
    existingId: input.existing?.id,
    status: input.payload.status,
    amountPaid: input.payload.amount,
    approvedAt: isApproved ? now() : null,
    shouldFireApprovalEmail: becomingApprovedNow,
  };
}
