### FDD: Webhook de Pagamento

Versão: 1.0
Data: 2026-04-26
Responsável: André dos Reis

---

### 1. Contexto e motivação técnica

O APP XPRO é uma plataforma global (fundador baseado na Europa) que integra múltiplas plataformas de pagamento regionais e globais. O fluxo actual usa um `WEBHOOK_SECRET` global partilhado entre todos os produtos e plataformas, sem isolamento por produto. Isso significa que um secret comprometido expõe todos os produtos de todos os admins, e um atacante que conhece o secret global pode forjar compras aprovadas para qualquer produto da plataforma.

Este FDD resolve o Risco 3 do HLD (webhook spoofing) e implementa o ADR-005 (idempotência por `UNIQUE(external_transaction_id)`), introduzindo:

1. **Arquitetura plugin de validadores** — cada plataforma tem um validador independente; adicionar nova plataforma não altera o core de processamento.
2. **Secret por produto** — `products.webhook_secret` alimenta todos os validadores; um secret comprometido afeta apenas um produto de um admin.
3. **Suporte multi-moeda** — campo `currency` em `purchases` para mercado global (EUR, USD, BRL).
4. **Auditoria completa** — tabela `webhook_logs` com raw body, TTL de 30 dias e purga automática via pg_cron.

A lógica de processamento é consolidada em `webhook-payment`; a Edge Function `process-payment` não é chamada neste fluxo (mantida apenas para o fluxo Stripe Checkout direto, fora do escopo deste FDD).

**Atores:**
- Plataformas de pagamento externas (Hotmart, Kiwify, Stripe, Monetizze, Eduzz, Paddle) que enviam eventos HTTP POST
- Edge Function `webhook-payment` (recebe, valida, processa)
- Supabase Auth Admin API (cria conta do aluno se não existir)
- Edge Function `send-purchase-confirmation` (e-mail ao aluno)
- Edge Function `send-notification` (notificação in-app)
- Admin (configura URL do webhook na plataforma de pagamento)

**Limites do escopo:**
- Esta feature trata apenas de webhooks de pagamento. Onboarding manual de alunos continua via `admin-invite-student`. Geração de certificado e fluxo de progresso são FDDs separados.

---

### 2. Objetivos técnicos

- Nenhum webhook sem HMAC/token válido resulta em `purchase` inserida; taxa de bypass com secret correto ausente deve ser 0%.
- Secret por produto garante isolamento: comprometimento de um secret afeta no máximo um produto.
- Idempotência garantida por `UNIQUE(external_transaction_id)` em `purchases`; o mesmo evento enviado N vezes produz exatamente uma `purchase`.
- Replay attack no Stripe bloqueado: eventos com timestamp do header `stripe-signature` com tolerância superior a 300s retornam 400 sem processamento.
- Adição de nova plataforma requer apenas implementar `WebhookValidator` e registar no mapa de plataformas; zero alteração no core de processamento.
- `currency` persistida em `purchases` para cada evento processado; suporte a EUR, USD, BRL e qualquer código ISO 4217.
- `webhook_logs` inserido antes de qualquer processamento de negócio; toda falha parcial é auditável.
- Registos em `webhook_logs` com `expires_at < now()` eliminados automaticamente; nenhum registo com mais de 30 dias permanece na tabela.
- Latência p95 de `webhook-payment` inferior a 3s no plano Supabase Pro, excluindo tempo de resposta do Stripe SDK.

---

### 3. Escopo e exclusões

**Incluído**
- Arquitetura plugin com interface `WebhookValidator` e `WebhookEvent`
- Tier 1: validadores com HMAC real para Stripe (HMAC-SHA256 via lib oficial), Kiwify (HMAC-SHA1 no raw body), Hotmart (timingSafeEqual no header)
- Tier 2: `GenericValidator` com timingSafeEqual para Monetizze, Eduzz, Paddle (documentado como dívida técnica)
- Identificação de produto via query string (`product_id` + `platform`) para todas as plataformas exceto Stripe
- Stripe com `STRIPE_WEBHOOK_SECRET` global de conta; produto identificado via `metadata.product_id` no evento já validado
- Processamento de eventos: mapeamento de eventos por plataforma para `approved`, `cancelled`, `refunded` (tabela completa na secção 4)
- Fluxo de criação/verificação de aluno (`ensureStudentExists`)
- Lógica de reactivação de compra (cancelled/refunded → novo approved com `external_transaction_id` diferente)
- Notificação in-app com `type = 'warning'` para cancelamentos e reembolsos
- Nova tabela `webhook_logs` com TTL 30 dias via coluna gerada e purga pg_cron diária
- Migração SQL: coluna `currency` em `purchases`
- RLS em `webhook_logs`
- Alerta de `unknown_event` acima de 5% do total por plataforma em 24h
- Alerta de `product_not_found` acima de 3 ocorrências do mesmo `product_id` em 1h

**Excluído**
- Job automático de reenvio de e-mail para compras sem confirmação (dívida técnica; critério de ativação: taxa de falha de e-mail > 1% ou base > 500 alunos)
- Mascaramento de PII em `webhook_logs.raw_body` (dívida técnica; v1.0 aceita PII com TTL 30 dias e RLS restritiva)
- Validadores HMAC reais para Tier 2 (Monetizze, Eduzz, Paddle) — iteração seguinte
- Fluxo de e-mail de cancelamento ao aluno (plataformas já notificam o comprador)
- `process-payment` Edge Function (mantida para fluxo Stripe Checkout; não chamada por webhooks)
- Suporte a múltiplas compras do mesmo produto pelo mesmo aluno (constraint `UNIQUE(user_id, product_id)` mantida)

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal: webhook recebido e processado**

1. Plataforma envia `POST /functions/v1/webhook-payment?platform=<nome>[&product_id=<uuid>]`.
2. Edge Function lê `platform` da query string; seleciona o `WebhookValidator` correspondente no mapa de plataformas; se `platform` desconhecido, retorna 400 imediatamente sem inserir `webhook_log`.
3. `validateRequest()`: lê `rawBody` como `Uint8Array` antes de qualquer parse; executa `validator.validate(req, rawBody, secret)`. Para Stripe: `secret = STRIPE_WEBHOOK_SECRET` do ambiente. Para demais: busca `products WHERE id = product_id` para obter `webhook_secret` e `payment_platform`; se produto não encontrado, avança para o passo 4 com `validation_result = 'product_not_found'`. Validação inválida retorna 400 sem inserir `webhook_log`.
4. `logWebhookReceived()`: INSERT em `webhook_logs` com `received_at`, `platform`, `request_id`, `raw_headers`, `raw_body`, `validation_result`, `product_id`; todos os passos seguintes atualizam este registo.
5. Se `product_not_found`: retorna 400 `{ "error": "product_not_found", "product_id": "<uuid>" }` e atualiza `webhook_log`.
6. `validator.parseEvent(rawBody)`: constrói `WebhookEvent`; mapeia evento da plataforma para `status` normalizado (tabela abaixo). Evento desconhecido: retorna 200 sem processamento; atualiza `webhook_log` com `validation_result = 'unknown_event'`; log `warn`.
7. Para Stripe: `product_id` lido de `metadata.product_id` do evento já validado; busca produto no DB.
8. `checkIdempotency()`: `SELECT purchases WHERE external_transaction_id = X`. Se existir com `status = 'approved'` e o novo evento é `approved`: retorna 200 sem ação; atualiza `webhook_log` com `processing_result = 'already_exists'`. Se existir com `status` em `cancelled`/`refunded` e o novo evento é `approved` com `external_transaction_id` diferente: avança para reativação.
9. `ensureStudentExists()`: busca `auth.users` por e-mail. Se não existe: `auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name } })`; trigger `handle_new_user` cria `profiles` e `user_roles` com `role = 'user'` automaticamente; sem envio de link de recovery (o e-mail de confirmação de compra contém instruções de acesso). Se já existe: verificar `user_roles.role`; se for `admin`, não alterar; se for `user`, nenhuma ação necessária. Falha: retorna 500; atualiza `webhook_log`.
10. `upsertPurchase()`:
    - `approved` (nova compra): `INSERT INTO purchases (user_id, product_id, amount_paid, currency, external_transaction_id, status, approved_at)`.
    - `approved` (reativação): `UPDATE purchases SET status = 'approved', amount_paid = novo_valor, external_transaction_id = novo_id, approved_at = now() WHERE user_id = X AND product_id = Y`.
    - `cancelled`/`refunded`: `UPDATE purchases SET status = 'cancelled'|'refunded' WHERE external_transaction_id = X`. Acesso revogado imediatamente via RLS (avaliada em tempo real no PostgreSQL; sem cache de sessão a invalidar).
    - Falha: retorna 500; atualiza `webhook_log`.
11. `notifyStudent()` (execução paralela, falha não bloqueia resposta):
    - Para `approved`: chama `send-purchase-confirmation` com `{ purchase_id, user_email }`.
    - Para `cancelled`/`refunded`: chama `send-notification` com `{ user_id, type: 'warning', message: 'Acesso ao produto foi revogado.' }`.
    - Falha em `send-purchase-confirmation`: log error com `purchase_id`; `purchase` permanece `approved`; retorna 200; cobertura manual via runbook.
    - Falha em `send-notification`: log error; não crítico; retorna 200.
12. Atualiza `webhook_log` com `processing_result` final.
13. Retorna 200.

**Mapeamento de eventos por plataforma:**

| Plataforma | Status normalizado | Eventos mapeados |
|---|---|---|
| Stripe | `approved` | `checkout.session.completed` |
| Stripe | `cancelled` | `payment_intent.canceled`, `customer.subscription.deleted` |
| Stripe | `refunded` | `charge.refunded`, `charge.dispute.created` |
| Hotmart | `approved` | `PURCHASE_APPROVED` |
| Hotmart | `cancelled` | `PURCHASE_CANCELED` |
| Hotmart | `refunded` | `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` |
| Kiwify | `approved` | `order.approved` |
| Kiwify | `cancelled` | `order.canceled` |
| Kiwify | `refunded` | `order.refunded`, `order.chargeback` |
| GenericValidator | `approved` | `approved` |
| GenericValidator | `cancelled` | `cancelled` |
| GenericValidator | `refunded` | `refunded` |

**Fluxos alternativos:**

- `platform` desconhecido na query string: retorna 400 `{ "error": "unknown_platform" }` antes do passo 4; sem `webhook_log`.
- Evento desconhecido: retorna 200 sem processamento; `webhook_log` com `validation_result = 'unknown_event'`; log `warn` com `raw_event_type`.
- Retry da plataforma após timeout parcial: `checkIdempotency` no passo 8 detecta `external_transaction_id` se `purchase` foi inserida; retorna 200 sem duplicata. Se `purchase` não foi inserida (falha antes do passo 10): reprocessa normalmente.
- Dois requests simultâneos com o mesmo `external_transaction_id`: o segundo falha na constraint `UNIQUE(external_transaction_id)` no passo 10 e retorna 500; a plataforma retenta; o retry encontra idempotência no passo 8 e retorna 200.

**Diagrama de sequência (fluxo principal — plataforma não-Stripe)**

```
Plataforma        Edge Function webhook-payment       PostgreSQL       Auth API       send-purchase-confirmation
    |                        |                            |                |                    |
    |--POST ?product_id=X--->|                            |                |                    |
    |                        |--validate HMAC (rawBody)   |                |                    |
    |                        |--SELECT products WHERE id---->              |                    |
    |                        |<--webhook_secret-----------                 |                    |
    |                        |--INSERT webhook_logs-------->               |                    |
    |                        |--parseEvent()               |               |                    |
    |                        |--SELECT purchases (idem.)-->|               |                    |
    |                        |<--não existe----------------|               |                    |
    |                        |--createUser (se novo)------>|               |                    |
    |                        |                             |<--createUser--|                    |
    |                        |--INSERT purchases---------->|               |                    |
    |                        |--UPDATE webhook_logs------->|               |                    |
    |                        |--[async] POST confirm--------------------------------->          |
    |<--200------------------|                            |                |                    |
```

---

### 5. Contratos públicos (assinaturas, endpoints, headers, exemplos)

**Endpoint: webhook-payment**

- Tipo: endpoint HTTP
- Rota: `POST /functions/v1/webhook-payment`
- Sem prefixo de versão conforme ADR-010

**URLs por plataforma configuradas pelo admin:**

```
Stripe:    POST /functions/v1/webhook-payment?platform=stripe
Hotmart:   POST /functions/v1/webhook-payment?product_id=<uuid>&platform=hotmart
Kiwify:    POST /functions/v1/webhook-payment?product_id=<uuid>&platform=kiwify
Monetizze: POST /functions/v1/webhook-payment?product_id=<uuid>&platform=monetizze
Eduzz:     POST /functions/v1/webhook-payment?product_id=<uuid>&platform=eduzz
Paddle:    POST /functions/v1/webhook-payment?product_id=<uuid>&platform=paddle
```

**Interfaces TypeScript internas (contratos da arquitetura plugin):**

```typescript
interface WebhookValidator {
  validate(
    req: Request,
    rawBody: Uint8Array,
    secret: string
  ): Promise<boolean>

  parseEvent(rawBody: Uint8Array): WebhookEvent
}

interface WebhookEvent {
  externalTransactionId: string
  externalProductId: string
  customerEmail: string
  customerName?: string
  amount: number
  currency: string  // ISO 4217: 'EUR' | 'USD' | 'BRL' | ...
  status: 'approved' | 'cancelled' | 'refunded'
  platform: string
  rawPayload: unknown  // persistido em webhook_logs.raw_body
}
```

**Validadores Tier 1:**

- `StripeValidator`: usa biblioteca oficial `stripe` npm compatível com Deno. Valida `stripe-signature` header com `STRIPE_WEBHOOK_SECRET` do ambiente. Rejeita eventos com timestamp superior a 300s de tolerância (replay attack). Produto identificado via `event.data.object.metadata.product_id`.
- `KiwifyValidator`: lê `X-Kiwify-Signature` header; calcula HMAC-SHA1 do `rawBody: Uint8Array`; compara com `timingSafeEqual`. `rawBody` nunca convertido para string antes do cálculo — reordenação de campos quebraria o HMAC.
- `HotmartValidator`: lê `X-Hotmart-Hottok` header; compara com `timingSafeEqual` contra `products.webhook_secret`. Não é HMAC — é comparação de string de tempo constante.

**Validador Tier 2:**

- `GenericValidator`: lê `x-webhook-signature` header; compara com `timingSafeEqual` contra `products.webhook_secret`. Documentado como dívida técnica; HMAC real a implementar por plataforma em iteração seguinte.

**Semântica de status HTTP:**

- 200: processado com sucesso (inclui duplicata idempotente e evento desconhecido)
- 400: HMAC/token inválido, plataforma desconhecida, produto não encontrado, replay attack Stripe
- 500: erro transiente (plataforma deve retentar com backoff exponencial)

**Limites:**
- Payload máximo: 6 MB (limite Supabase Edge)
- Timeout: 10s para o processamento (excluindo chamadas assíncronas de notificação)
- Sem autenticação JWT — validação exclusivamente por HMAC/token de plataforma

**Exemplo de requisição Hotmart:**

Headers:
```
X-Hotmart-Hottok: secret-configurado-no-produto
Content-Type: application/json
X-Request-Id: uuid-v4
```

Body (raw):
```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "purchase": {
      "transaction": "HP17715700836",
      "price": { "value": 197.00, "currencyCode": "BRL" }
    },
    "product": { "id": "external-product-id" },
    "buyer": {
      "email": "aluno@exemplo.com",
      "name": "Nome do Aluno"
    }
  }
}
```

Exemplo de resposta 200:
```json
{ "ok": true }
```

Exemplo de resposta 400 (produto não encontrado):
```json
{
  "error": "product_not_found",
  "product_id": "uuid-do-produto"
}
```

---

### 6. Erros, exceções e fallback

**Matriz de erros previstos:**

| Condição | HTTP | `webhook_log` | Ação |
|---|---|---|---|
| `platform` desconhecido na query string | 400 | Não inserido | Log warn |
| HMAC/token inválido | 400 | Não inserido | Log warn |
| Replay attack Stripe (timestamp > 300s) | 400 | Não inserido | Log warn |
| `product_id` não encontrado no DB | 400 | Inserido (`product_not_found`) | Log warn; alerta se > 3 ocorrências do mesmo `product_id` em 1h |
| Evento desconhecido para a plataforma | 200 | Inserido (`unknown_event`) | Log warn com `raw_event_type` |
| `external_transaction_id` já existe e `status = 'approved'` | 200 | Inserido (`already_exists`) | Log info |
| Falha em `auth.admin.createUser` | 500 | Inserido (`error`) | Log error; `purchase` não inserida; plataforma retenta |
| Falha no INSERT/UPDATE de `purchases` | 500 | Inserido (`error`) | Log error; plataforma retenta |
| Falha em `send-purchase-confirmation` | 200 | Inserido com `error_details`) | Log error com `purchase_id`; `purchase` permanece `approved`; cobertura por runbook |
| Falha em `send-notification` | 200 | Atualizado | Log error; não crítico |
| Timeout da Edge Function (> limite Supabase) | 500 | Inserido se passo 4 foi atingido | Plataforma retenta; idempotência garante segurança |

**Estratégias de resiliência:**
- Idempotência aplicacional por `UNIQUE(external_transaction_id)`: retries da plataforma são sempre seguros após o passo 4.
- `logWebhookReceived` no passo 2 garante que toda falha parcial é auditável: nunca perde rastreabilidade de um evento recebido.
- Notificações executadas em paralelo e após `return 200` (fire-and-forget com log de falha): falha em notificação não reverte a compra.
- Retry da plataforma com backoff exponencial (comportamento nativo do Hotmart e Kiwify para respostas 5xx).

**Invariantes críticos:**
- `rawBody` lido como `Uint8Array` antes de qualquer parsing JSON; nunca convertido antes da validação do HMAC.
- `webhook_logs` inserido antes de qualquer operação de negócio; a falha em `logWebhookReceived` não deve bloquear o processamento — log de erro e continua.
- `ensureStudentExists` nunca envia link de recovery; o e-mail de confirmação de compra contém instruções de acesso.
- Cancelamento e reembolso usam `external_transaction_id` como chave de lookup, não `(user_id, product_id)`, para garantir que se cancela a transação correta e não uma reativação posterior.
- `products.webhook_secret` nunca logado, nunca retornado em resposta.

**Fallback:**
- Se `webhook-payment` estiver indisponível, plataformas com retry exponencial (Hotmart, Kiwify) reenviarão durante horas. Sem perda de dados se RTO < 24h.
- `send-purchase-confirmation` indisponível: `purchase` já está `approved`; admin pode reenviar e-mail manualmente via Supabase Dashboard consultando `purchases WHERE approved_at > now() - interval '1 day' AND status = 'approved'`.

---

### 7. Observabilidade

**Métricas:**

- `webhook.received` (contador por `platform`): total de webhooks recebidos
- `webhook.validation.invalid` (contador por `platform`, `reason`): HMAC inválido, replay, plataforma desconhecida
- `webhook.event.unknown` (contador por `platform`, `raw_event_type`): eventos não mapeados
- `webhook.processing.result` (contador por `platform`, `result`: `purchase_created`, `purchase_reactivated`, `cancelled`, `refunded`, `already_exists`, `error`)
- `webhook.student.created` (contador): novos alunos criados via webhook
- `webhook.notification.failure` (contador por `type`: `email`, `inapp`)
- `webhook.latency` (histograma por `platform`; targets: p50 < 1s, p95 < 3s, p99 < 5s)
- `webhook.product_not_found` (contador por `product_id`): alerta se > 3 em 1h para o mesmo ID
- `webhook.unknown_event_rate` (taxa por `platform` em 24h): alerta se > 5% do total da plataforma

**Logs:**

Formato: JSON estruturado. Campos obrigatórios em todos os eventos:

```json
{
  "timestamp": "2026-04-26T10:00:00.000Z",
  "level": "info|warn|error",
  "function": "webhook-payment",
  "request_id": "uuid-v4",
  "platform": "hotmart|kiwify|stripe|...",
  "external_transaction_id": "HP177...",
  "product_id": "uuid",
  "event": "purchase_created|already_exists|unknown_event|error|...",
  "error": { "code": "", "message": "" }
}
```

Campos nunca logados: `webhook_secret`, `raw_body` inline nos logs (raw body vai apenas para `webhook_logs`), `stripe-signature` header completo. `user_id` e `email` logados apenas como hash SHA-256 com salt.

Log específico para evento desconhecido:

```json
{
  "level": "warn",
  "event": "unknown_webhook_event",
  "platform": "hotmart",
  "raw_event_type": "PURCHASE_DELAYED",
  "external_transaction_id": "HP177...",
  "request_id": "uuid"
}
```

**Tracing:**

- `webhook-payment.request` (span raiz; labels: `platform`, `request_id`)
- `webhook-payment.validate` (span filho; duração da validação HMAC/token)
- `webhook-payment.db.log_received` (span filho; INSERT em `webhook_logs`)
- `webhook-payment.db.identify_product` (span filho; SELECT em `products`)
- `webhook-payment.db.check_idempotency` (span filho; SELECT em `purchases`)
- `webhook-payment.auth.ensure_student` (span filho; inclui `createUser` se necessário)
- `webhook-payment.db.upsert_purchase` (span filho; INSERT ou UPDATE em `purchases`)
- `webhook-payment.notify` (span filho; inclui chamadas paralelas a `send-purchase-confirmation` e `send-notification`)

Amostragem: 100% em v1.0 (volume de admins e produtos inicial pequeno).

**Dashboards e alertas:**

- Painel: taxa de sucesso por plataforma por dia (métrica `webhook.processing.result`)
- Painel: latência p95 por plataforma
- Alerta: `webhook.unknown_event_rate > 5%` por plataforma em 24h — indica mudança de API da plataforma (Risco 11 HLD); canal: e-mail do operador
- Alerta: `webhook.product_not_found` com mesmo `product_id` > 3 vezes em 1h — indica configuração incorreta no painel da plataforma; canal: e-mail do operador
- Alerta: `webhook.processing.result{result='error'} > 1%` em 10 min — canal: e-mail do operador

---

### 8. Dependências e compatibilidade

| Componente | Versão mínima | Observações |
|---|---|---|
| Supabase Edge Functions (Deno) | Runtime atual Supabase | `crypto.subtle` nativo para HMAC-SHA1/SHA256; `timingSafeEqual` via `std/crypto` Deno |
| `stripe` npm (Deno-compatible) | Latest stable | Verificação de `stripe-signature` e replay attack; importar via CDN compatible com Deno |
| Supabase Auth Admin API | v2 | `auth.admin.createUser` com `email_confirm: true` |
| Supabase PostgreSQL | 15 + pg_cron | pg_cron para purga diária de `webhook_logs`; disponível apenas no plano Pro |
| `send-purchase-confirmation` Edge Function | — | Chamada assíncrona com `{ purchase_id, user_email }` |
| `send-notification` Edge Function | — | Chamada assíncrona com `{ user_id, type, message }` |
| Hotmart webhook | API atual | Header `X-Hotmart-Hottok`; sem SLA de estabilidade contratual |
| Kiwify webhook | API atual | Header `X-Kiwify-Signature`; HMAC-SHA1; sem SLA de estabilidade contratual |
| Stripe webhook | API v2 | `stripe-signature` com timestamp; SLA 99.99% Stripe |

**Migração SQL necessária:**

```sql
-- Adicionar currency a purchases (approved_at já existe)
ALTER TABLE purchases
ADD COLUMN currency text NOT NULL DEFAULT 'BRL';

CREATE INDEX idx_purchases_currency ON purchases(currency);

-- Tabela de auditoria webhook_logs
CREATE TABLE webhook_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at           timestamptz NOT NULL DEFAULT now(),
  platform              text        NOT NULL,
  external_transaction_id text,
  product_id            uuid        REFERENCES products(id),
  request_id            text        NOT NULL,
  raw_headers           jsonb       NOT NULL,
  raw_body              jsonb       NOT NULL,
  validation_result     text        NOT NULL,
  -- 'valid' | 'invalid_signature' | 'unknown_event' | 'idempotent_skip' | 'product_not_found'
  processing_result     text,
  -- 'purchase_created' | 'purchase_updated' | 'purchase_reactivated' |
  -- 'already_exists' | 'cancelled' | 'refunded' | 'error'
  error_details         jsonb,
  expires_at            timestamptz NOT NULL
    GENERATED ALWAYS AS (received_at + interval '30 days') STORED
);

CREATE INDEX idx_webhook_logs_transaction ON webhook_logs(external_transaction_id);
CREATE INDEX idx_webhook_logs_expires_at  ON webhook_logs(expires_at);

-- Purga automática diária (requer pg_cron no plano Pro)
SELECT cron.schedule(
  'purge-webhook-logs',
  '0 3 * * *',  -- diariamente às 3h UTC
  $$DELETE FROM webhook_logs WHERE expires_at < now();$$
);
```

**Políticas RLS em `webhook_logs`:**
- SELECT: admin autenticado vê logs dos seus produtos via `product_id → products.admin_id = auth.uid()` com verificação de role admin
- INSERT: apenas via Service Role Key (Edge Function)
- UPDATE: apenas via Service Role Key
- DELETE: nenhuma policy; deleção apenas via pg_cron com Service Role

**Dívidas técnicas registadas:**
- `webhook_logs.raw_body` contém PII (e-mail, nome do comprador). Em v1.0 aceita-se com TTL 30 dias e RLS restritiva. Estado alvo: mascarar campos PII antes de persistir (substituir e-mail por hash SHA-256 com salt, remover nome completo).
- Validadores HMAC reais para Monetizze, Eduzz e Paddle (Tier 2): implementar em iteração seguinte com os mesmos padrões do Tier 1.
- Job de reenvio de e-mail para compras sem confirmação: ativar quando taxa de falha de e-mail ultrapassar 1% ou base ultrapassar 500 alunos.
- `pg_cron` não disponível no plano Supabase Free: fallback é Edge Function agendada via Supabase Scheduled Functions com o mesmo SQL de purga.

**Garantias de compatibilidade:**
- Adição de nova plataforma: implementar `WebhookValidator`, registar no mapa de plataformas, sem alterar core de processamento.
- `products.webhook_secret` e `products.payment_platform` já existem no schema; sem migração adicional.
- `purchases.approved_at` já existe; não adicionado na migração.
- Nenhuma interface existente é alterada; `process-payment` mantida para fluxo Stripe Checkout.

---

### 9. Critérios de aceite técnicos

- Webhook Stripe com assinatura válida e timestamp superior a 300s retorna 400 sem inserir `purchase` nem `webhook_log`.
- Mesmo `external_transaction_id` enviado duas vezes: segunda chamada retorna 200 sem criar segunda `purchase`; `webhook_log` registado com `processing_result = 'already_exists'`.
- Webhook com `product_id` inexistente retorna 400 `{ "error": "product_not_found" }`; `webhook_log` inserido com `processing_result = 'product_not_found'`.
- `purchase` com `status = 'cancelled'` recebe novo webhook `approved` com `external_transaction_id` diferente: UPDATE correto para `status = 'approved'`; `webhook_log` com `processing_result = 'purchase_reactivated'`.
- `currency = 'EUR'` persistido corretamente em `purchases.currency` para evento Stripe de conta europeia.
- `send-purchase-confirmation` falha: `purchase` permanece `approved`; webhook retorna 200; log contém `purchase_id`.
- `send-notification` falha: `purchase` permanece inalterada; webhook retorna 200.
- Aluno autenticado que tenta `supabase.from('purchases').insert(...)` diretamente é bloqueado por RLS.
- HMAC inválido no Kiwify retorna 400; nenhum `webhook_log` inserido.
- Evento desconhecido (ex: `PURCHASE_DELAYED` no Hotmart) retorna 200; `webhook_log` com `validation_result = 'unknown_event'`; log `warn` com `raw_event_type`.
- pg_cron purga `webhook_logs` com `expires_at < now()` diariamente; registos com mais de 30 dias não existem na tabela após a próxima execução do job.
- Alerta disparado quando mesmo `product_id` retorna `product_not_found` mais de 3 vezes em 1h.
- `products.webhook_secret` não aparece em nenhum log estruturado.
- Latência p95 de `webhook-payment` inferior a 3s no plano Supabase Pro em carga normal.

---

### 10. Riscos e mitigação

#### Risco 1: PII em `webhook_logs.raw_body`

- **Probabilidade:** alta (garantido que contém e-mail e nome do comprador)
- **Impacto:** médio; dado sensível em tabela de auditoria com acesso de admin; implicação LGPD/GDPR
- **Mitigação:**
    - Acesso restrito por RLS a admins do produto (admin vê apenas logs dos seus produtos)
    - TTL de 30 dias limita janela de exposição
    - `webhook_logs` nunca exposto via API pública; apenas via painel admin autenticado
- **Plano de contingência:** se vazamento detectado, purgar `webhook_logs` imediatamente via Service Role Key e notificar afetados conforme Art. 48 LGPD / Art. 33 GDPR dentro de 72h

#### Risco 2: Plataforma altera formato de webhook sem aviso prévio

- **Probabilidade:** média (Hotmart, Kiwify sem SLA de estabilidade contratual)
- **Impacto:** alto; webhooks rejeitados silenciosamente, `purchases` não processadas, alunos sem acesso
- **Mitigação:**
    - Log completo do `raw_body` em `webhook_logs` (retido 30 dias) permite re-processamento manual
    - Alerta de taxa de `unknown_event > 5%` por plataforma em 24h detecta mudança antes de impacto total
    - Suite de testes com fixtures de payload por plataforma (Risco 11 HLD)
- **Plano de contingência:** liberação manual de acesso via painel admin enquanto parser é corrigido; re-processar eventos do `webhook_logs` após correção

#### Risco 3: `pg_cron` indisponível no plano Supabase Free

- **Probabilidade:** alta (pg_cron requer plano Pro)
- **Impacto:** baixo; `webhook_logs` acumula sem purga automática; não afeta funcionalidade; problema de storage
- **Mitigação:**
    - Fallback documentado: Edge Function agendada via Supabase Scheduled Functions com mesmo SQL
    - `expires_at` coluna gerada permite query manual trivial de limpeza
- **Plano de contingência:** operador executa `DELETE FROM webhook_logs WHERE expires_at < now()` via SQL Editor manualmente enquanto upgrade de plano não é feito

#### Risco 4: Hot keys em `purchases` durante lançamento popular

- **Probabilidade:** média (acima de 500 webhooks simultâneos para o mesmo produto)
- **Impacto:** médio; lock contention pode degradar latência de `webhook-payment` por minutos
- **Mitigação:**
    - Índice `purchases(product_id, status)` evita full scan
    - Monitorização de latência p95 de `webhook-payment` durante lançamentos
    - Acima de 500 webhooks simultâneos, introduzir `webhook_queue` + worker (Risco 7 HLD)
- **Plano de contingência:** escalar plano Supabase ou ativar buffer assíncrono emergencial

#### Risco 5: Stripe SDK incompatível com Deno runtime

- **Probabilidade:** baixa (Stripe mantém compatibilidade com Deno via CDN)
- **Impacto:** alto; validação Stripe não funciona sem a biblioteca oficial
- **Mitigação:**
    - Testar importação via CDN Deno-compatible em staging antes do deploy
    - Fixar versão do SDK no import para evitar breaking changes silenciosos
    - Implementação manual de fallback de HMAC-SHA256 documentada mas não deployada
- **Plano de contingência:** se SDK incompatível, implementar validação manual de `stripe-signature` com `crypto.subtle` nativo do Deno (algoritmo público na documentação Stripe)
