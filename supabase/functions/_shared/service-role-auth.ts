/**
 * Helper pure para validar autenticação service-role em Edge Functions.
 *
 * Várias Edge Functions internas (`send-purchase-confirmation`,
 * `send-notification`) só podem ser invocadas server-to-server por outras
 * Edge Functions (ex: `webhook-payment` chama `send-purchase-confirmation`
 * via `supabase.functions.invoke` que propaga o service-role bearer).
 *
 * Este helper é o gate único: dado o header `Authorization` recebido e a
 * chave esperada, retorna true apenas se forem **exactamente** iguais no
 * formato `Bearer <expectedKey>`.
 *
 * Comportamento crítico (cobre testes Tier 1):
 *   - `expectedKey` undefined ou empty → false (fail-closed; misconfigured env)
 *   - `authHeader` null → false
 *   - Header sem `Bearer ` prefix → false
 *   - Bearer com token truncado / errado → false (sem startsWith / substring)
 *   - Bearer com a key exacta → true
 *
 * Notas:
 *  - A comparação é simple `===` em strings. Não é constant-time. Para
 *    service-role keys (>= 256 chars de base64url), timing attacks são
 *    impraticáveis: o atacante teria que enviar trilhões de variantes para
 *    extrair informação. Suficiente para v1.0.
 *  - Se uma function mais sensível precisar de constant-time, importar
 *    `timingSafeEqual` de `verify-webhook-signature.ts`.
 */

export function isServiceRoleAuthorized(
  authHeader: string | null,
  expectedKey: string | undefined,
): boolean {
  if (!expectedKey) {
    return false;
  }
  if (!authHeader) {
    return false;
  }
  return authHeader === `Bearer ${expectedKey}`;
}
