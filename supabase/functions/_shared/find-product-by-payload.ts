import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Helper de lookup de produto por payload de webhook de pagamento.
 *
 * Histórico (Bug 3 do TEST-GAP-ANALYSIS):
 * O bloco original usava `.or(`external_product_id.eq.${...},id.eq.${...}`)`
 * com interpolação directa no filtro PostgREST, criando dois problemas:
 *   1. Se ambos os identificadores fossem `undefined`, a expressão era
 *      `external_product_id.eq.undefined,id.eq.undefined` — provoca erro do
 *      Postgres ou matcha NULL rows.
 *   2. Caracteres especiais do PostgREST (vírgula, ponto, parêntesis) em
 *      `external_product_id` quebrariam a expressão e poderiam matchar produtos
 *      não pretendidos (filter injection).
 *
 * Esta implementação usa `.eq()` separados (driver parametriza o valor; sem
 * possibilidade de injection) e valida que `product_id` é UUID antes do
 * fallback. Selecciona `admin_id` para preparar isolamento per-tenant quando
 * o webhook secret migrar para `products.webhook_secret` (HLD Risco 3).
 */
export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export interface WebhookProductRef {
  external_product_id?: string | null;
  product_id?: string | null;
}

export async function findProductByPayload(
  client: SupabaseClient,
  payload: WebhookProductRef,
): Promise<{ id: string; admin_id: string } | null> {
  const externalProductId =
    typeof payload.external_product_id === "string" &&
    payload.external_product_id.trim()
      ? payload.external_product_id.trim()
      : null;
  const productIdInput =
    typeof payload.product_id === "string" && payload.product_id.trim()
      ? payload.product_id.trim()
      : null;

  if (!externalProductId && !productIdInput) {
    throw new Error("Missing product identifier in webhook payload");
  }

  let product: { id: string; admin_id: string } | null = null;

  if (externalProductId) {
    const { data, error } = await client
      .from("products")
      .select("id, admin_id")
      .eq("external_product_id", externalProductId)
      .maybeSingle();
    if (error) throw error;
    product = data ?? null;
  }

  if (!product && productIdInput && UUID_REGEX.test(productIdInput)) {
    const { data, error } = await client
      .from("products")
      .select("id, admin_id")
      .eq("id", productIdInput)
      .maybeSingle();
    if (error) throw error;
    product = data ?? null;
  }

  return product;
}
