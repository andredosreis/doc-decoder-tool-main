# Potential ADR: Idempotência de webhook por UNIQUE(external_transaction_id)

**Module:** BILLING
**Category:** Data Integrity
**Priority:** must-document
**Score:** 125/150

---

## What Was Identified

Plataformas de pagamento externas (Hotmart, Kiwify, Monetizze, Stripe) re-enviam webhooks por retry exponencial em caso de resposta não-2xx. Aplicação não introduz fila intermédia em v1.0; em vez disso, depende de constraint `UNIQUE(external_transaction_id)` em `purchases` como mecanismo único de defesa contra duplicação aplicacional.

Edge Function `webhook-payment` recebe payload, valida assinatura por plataforma, transforma em `INSERT INTO purchases`. Se o INSERT viola a constraint (mesma transaction já registada), erro `23505` é tratado como duplicação benigna e retorna 200 OK ao webhook sender (evita mais retries). Sem este constraint, a mesma compra pode gerar múltiplas linhas e dar acesso duplicado.

Introduced: 2026-04-26 (FDD-002 Webhook de Pagamento)

## Why This Might Deserve an ADR

**Impact:** Correcção financeira directa. Duplicação implica acesso múltiplo, e-mails repetidos, certificados duplicados.

**Trade-offs:** Simplicidade SQL nativa + sem componentes adicionais (sem Redis/fila) + at-least-once efectivamente garantido pelas plataformas externas vs exige a constraint estar fisicamente presente (ainda não aplicada — passo 2 dos próximos passos do HLD); restringe modelo de "renovação" pelo aluno (UNIQUE adicional `(user_id, product_id)` bloqueia renovação; dívida técnica registada).

**Complexity:** Trivial. Uma constraint SQL.

**Team Knowledge:** Padrão conhecido em integração de webhooks.

**Future Implications:** Renovação de acesso (mesma compra após expirar) requer relaxar para `UNIQUE(user_id, product_id, external_transaction_id)` ou modelo de soft-delete por linha. Decisão futura quando volume justificar.

## Evidence Found in Codebase

**Key Files:**
- supabase/functions/webhook-payment/index.ts:1
- EXECUTAR_NO_SUPABASE.sql:1 (constraint a aplicar via migration)
- .claude/docs/FDD-webhook-pagamento.md:1
- src/services/purchases.service.ts:1

**Impact Analysis:**
Sem a constraint, qualquer falha temporária do servidor que cause não-2xx seguida de retry da plataforma resulta em row duplicada. Hotmart, Kiwify e Monetizze aplicam retry exponencial; Stripe usa idempotency key própria mas mesmo assim re-envia. Introduced: 2026-04-26.

**Alternative Not Chosen:**
Idempotency table separada (`idempotency_keys` com TTL) em vez de constraint na tabela primária. Rejeitada por overkill quando a constraint nativa do PostgreSQL já resolve em SQL atómico, sem código aplicacional adicional, sem TTL de manutenção. Considerou-se também usar hash de payload como chave de idempotência; rejeitada por payload variar entre retries (timestamps diferentes).

## Questions to Address in ADR

- Quando aplicar a migration que adiciona a constraint? Antes ou depois do PR de Edge Function?
- Como reconciliar duplicações detectadas em produção (caso a constraint só seja aplicada após primeiros webhooks reais)?
- Estratégia de monitorização de violações 23505 (sinal de retry; volume sugere problema upstream)?

## Additional Notes

Constraint UNIQUE(external_transaction_id) é registada como passo 2 de "Próximos passos" do HLD, antes de qualquer optimização de `webhook-payment`. Nenhum FDD de webhook deve assumir idempotência sem esta constraint primeiro.
