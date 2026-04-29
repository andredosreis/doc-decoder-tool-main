# ADR-005: Idempotência de Webhook por UNIQUE(external_transaction_id)

**Status:** Aceito
**Data:** 26-04-2026

**Depende de:** [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)

**ADRs Relacionadas:**
- [ADR-010: Sem versionamento de URL nas Edge Functions; breaking change via sufixo -v2](../API/ADR-010-sem-versionamento-url-edge-functions-sufixo-v2.md)
- [ADR-012: Adotar supabase/migrations versionado como fonte de verdade do schema](../SCHEMA/ADR-012-supabase-migrations-versionadas.md)

---

## 1. Contexto e Problema

Plataformas de pagamento externas (Hotmart, Kiwify, Monetizze, Stripe) adotam retry exponencial ao receberem resposta não-2xx de um endpoint de webhook. Em uma plataforma SaaS multi-tenant para cursos digitais, um webhook de compra aprovada tem impacto financeiro direto: sua duplicação gera múltiplas linhas de compra para o mesmo evento, resultando em acesso duplicado ao produto, e-mails de confirmação repetidos e emissão de certificados duplicados.

A plataforma não introduz fila intermediária em v1.0. Todo o processamento de webhooks ocorre de forma síncrona na Edge Function `webhook-payment`, que valida a assinatura da plataforma, identifica o produto e registra a compra. Sem um mecanismo de deduplicação, qualquer falha temporária que force um retry da plataforma pode criar inconsistências financeiras e operacionais.

O problema central é: como garantir idempotência de webhooks de pagamento sem introduzir infraestrutura adicional (fila, cache externo ou tabela separada de rastreamento) que aumente a complexidade operacional em v1.0?

## 2. Direcionadores da Decisão

- Correção financeira direta: duplicação de compra implica acesso indevido, e-mails repetidos e certificados duplicados.
- Retries são garantidos pelas plataformas externas; at-least-once é comportamento contratual, não exceção.
- Ausência de fila intermediária em v1.0; a solução deve operar dentro do stack existente (PostgreSQL + Edge Functions).
- Atomicidade necessária: a verificação de duplicidade e a inserção devem ser operações inseparáveis para evitar race conditions em retries simultâneos.
- Complexidade mínima: manutenção operacional deve ser trivial sem componentes adicionais a operar.

## 3. Opções Consideradas

- **Opção A:** Constraint `UNIQUE(external_transaction_id)` na tabela `purchases` com tratamento do erro `23505` como duplicata benigna.
- **Opção B:** Tabela separada `idempotency_keys` com TTL e lógica de expiração gerida pela aplicação.
- **Opção C:** Hash do payload do webhook como chave de idempotência sem constraint de banco.

## 4. Resultado da Decisão

**Opção escolhida: Opção A**, porque a constraint `UNIQUE(external_transaction_id)` no PostgreSQL resolve o problema de forma atômica no banco de dados, sem código aplicacional adicional, sem TTL de manutenção e sem novos componentes operacionais. O erro `23505` (unique violation) é tratado pela Edge Function como duplicata benigna, retornando 200 ao webhook sender e interrompendo o ciclo de retries da plataforma.

[NECESSITA INFORMAÇÃO: Qual é a estratégia de reconciliação caso a constraint seja aplicada após os primeiros webhooks reais em produção? Definir procedimento de verificação de duplicatas preexistentes antes da migration.]

## 5. Prós e Contras das Opções

### Opção A: UNIQUE(external_transaction_id) em purchases

**Prós:**
- Atomicidade garantida pelo PostgreSQL sem código adicional na aplicação.
- Deduplicação funciona corretamente mesmo em retries simultâneos (race condition resolvida pelo banco).
- Sem TTL de manutenção; a constraint persiste indefinidamente sem operação periódica.
- Tratamento de `23505` é padrão estabelecido em integração de webhooks.

**Contras:**
- Exige que a migration seja aplicada antes do primeiro webhook real; constraint ausente invalida toda a garantia.
- Constraint `UNIQUE(user_id, product_id)` coexistente impede renovação de acesso pelo mesmo aluno ao mesmo produto — dívida técnica registrada no modelo de dados.

### Opção B: Tabela separada idempotency_keys com TTL

**Prós:**
- Separação explícita entre lógica de idempotência e lógica de negócio.
- TTL configurável por tipo de evento.

**Contras:**
- Componente adicional a manter (tabela, índice, job de expiração).
- Requer transação distribuída ou lógica de compensação para garantir consistência entre `idempotency_keys` e `purchases`.
- Overkill quando a constraint nativa do PostgreSQL já resolve em SQL atômico.

### Opção C: Hash de payload como chave de idempotência

**Prós:**
- Não requer campo `external_transaction_id` no payload da plataforma.

**Contras:**
- Payload varia entre retries (campos de timestamp, metadata de request); hash diferente para o mesmo evento lógico.
- Não garante idempotência real; aumenta risco de duplicatas.

## 6. Consequências

A constraint `UNIQUE(external_transaction_id)` torna-se o mecanismo único de defesa contra duplicação aplicacional de webhooks em v1.0. Qualquer deploy de `webhook-payment` deve ser precedido pela migration que adiciona a constraint; a ausência desta constraint invalida toda a garantia de idempotência documentada neste ADR e no FDD de Webhook de Pagamento.

A coexistência com `UNIQUE(user_id, product_id)` em `purchases` cria uma dívida técnica conhecida: o modelo atual impede que um aluno renove o acesso ao mesmo produto após expiração ou cancelamento com novo `external_transaction_id`. A resolução futura documentada no HLD é relaxar para `UNIQUE(user_id, product_id, external_transaction_id)` ou adotar soft-delete por linha quando o volume de casos de renovação justificar.

A taxa de violação `23505` em produção é um sinal operacional relevante: volume elevado indica problema upstream na plataforma de pagamento (retries excessivos por timeout), não erro da aplicação. O monitoramento desta taxa deve ser incluído nos alertas de observabilidade do módulo BILLING.

## 7. Referências

- `.claude/docs/HLD.md` — seção "Constraints críticos" e "Próximos passos" (passo 2)
- `.claude/docs/FDD-webhook-pagamento.md` — seção 2 (objetivos técnicos de idempotência) e seção 6 (estratégias de resiliência)
- `supabase/functions/webhook-payment/index.ts:1`
- `EXECUTAR_NO_SUPABASE.sql:1`
