/**
 * Helper para construir o metadata enviado para a Stripe em create-checkout.
 *
 * Histórico (Bug 2 do TEST-GAP-ANALYSIS):
 * A versão anterior incluía o campo `password` em plaintext na metadata
 * (`{ ..., password: password }`). Stripe metadata é armazenamento plaintext,
 * visível no dashboard, em logs de webhook, em exports — violação PCI-DSS e
 * LGPD. O comentário "Store password securely in metadata" era falso.
 *
 * Esta função é o ponto único de construção do objecto. O teste correspondente
 * assegura que nunca aparece uma chave "password" no resultado, mesmo se o
 * input for cast para `any` com um campo password indevido.
 */
export interface CheckoutMetadataInput {
  email: string;
  fullName?: string;
  plan: string;
}

export function buildCheckoutMetadata(
  input: CheckoutMetadataInput,
): Record<string, string> {
  return {
    email: input.email,
    full_name: input.fullName ?? "",
    plan: input.plan,
  };
}
