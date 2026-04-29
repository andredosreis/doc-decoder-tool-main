/**
 * Validação de assinatura de webhook de pagamentos.
 *
 * Estado actual (v1.0): shared-secret global em `WEBHOOK_SECRET` env var; o
 * caller envia o valor literal no header `x-webhook-signature`. Comparação
 * em tempo constante para evitar timing attacks.
 *
 * Estado alvo (HLD Risco 3): per-product secret em `products.webhook_secret`
 * e validação HMAC nativa por plataforma (Stripe, Hotmart, Kiwify, etc.).
 *
 * Esta função é o gate de autenticação único de `webhook-payment`. Qualquer
 * regression que silencie a rejeição (acceptance default) é critical:
 * cobre os tests de regressão correspondentes ao Tier 1 do test plan.
 */

/**
 * Compara duas strings byte-a-byte em tempo constante.
 *
 * Comportamento:
 * - Comprimentos diferentes: retorna false imediatamente (length leak é
 *   aceitável para shared secrets de tamanho fixo conhecido).
 * - Mesmo comprimento: faz XOR byte-a-byte e acumula em `result`; retorna
 *   true apenas se `result === 0`.
 *
 * Crítico que o loop NÃO faça early exit num mismatch — se o fizer, um
 * atacante pode descobrir bytes correctos por timing.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

/**
 * Valida o request contra `WEBHOOK_SECRET`.
 *
 * Retorna false (→ 401 no caller) em qualquer das condições:
 *   - `expectedSecret` não fornecido E env var `WEBHOOK_SECRET` não configurada
 *   - header `x-webhook-signature` ausente ou vazio
 *   - valor do header não bate com o secret (timing-safe)
 *
 * O parâmetro `expectedSecret` permite injecção em tests; em produção o
 * caller chama sem argumentos e a env var é usada.
 *
 * IMPORTANTE: a função NÃO faz `.trim()` nem `.toLowerCase()` no header.
 * Whitespace e case são significativos. Plataformas de pagamento mandam
 * o secret literal; sanitizar mascara erros de configuração.
 */
export function validateWebhookSignature(
  req: Request,
  expectedSecret?: string,
): boolean {
  const webhookSecret = expectedSecret ??
    (typeof Deno !== "undefined" ? Deno.env.get("WEBHOOK_SECRET") : undefined);

  if (!webhookSecret) {
    console.error(
      "WEBHOOK_SECRET environment variable is not set. All webhook requests will be rejected.",
    );
    return false;
  }

  const signature = req.headers.get("x-webhook-signature");

  if (!signature) {
    console.warn("Webhook rejected: missing x-webhook-signature header");
    return false;
  }

  const valid = timingSafeEqual(signature, webhookSecret);
  if (!valid) {
    console.warn("Webhook rejected: invalid x-webhook-signature header");
  }
  return valid;
}
