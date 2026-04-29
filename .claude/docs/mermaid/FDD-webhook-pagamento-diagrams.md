# Diagramas Mermaid - Webhook de Pagamento

## Visão Geral

O `webhook-payment` é a Edge Function central que recebe, valida e processa eventos de pagamento de seis plataformas externas (Hotmart, Kiwify, Stripe, Monetizze, Eduzz, Paddle). A arquitetura é baseada em plugins: cada plataforma possui um `WebhookValidator` independente, e adicionar uma nova plataforma não altera o core de processamento. O sistema garante idempotência por `UNIQUE(external_transaction_id)` em `purchases`, auditoria completa em `webhook_logs` com TTL de 30 dias, e isolamento de secret por produto via `products.webhook_secret`.

---

## Elementos Identificados

### Fluxos Externos

- `POST /functions/v1/webhook-payment?platform=<nome>[&product_id=<uuid>]` recebido das plataformas
- Resposta 200 para sucesso, duplicata idempotente e evento desconhecido
- Resposta 400 para HMAC inválido, plataforma desconhecida, produto não encontrado, replay attack Stripe
- Resposta 500 para erros transientes (plataforma retenta com backoff exponencial)
- Chamada assíncrona a `send-purchase-confirmation` com `{ purchase_id, user_email }`
- Chamada assíncrona a `send-notification` com `{ user_id, type: 'warning', message }`

### Processos Internos

- Seleção de `WebhookValidator` por plataforma no mapa de validadores
- `validateRequest()`: lê `rawBody` como `Uint8Array` antes de qualquer parse; executa `validator.validate()`
- `logWebhookReceived()`: INSERT em `webhook_logs` antes de qualquer operação de negócio
- `validator.parseEvent()`: constrói `WebhookEvent`; mapeia evento da plataforma para status normalizado
- `checkIdempotency()`: SELECT em `purchases` por `external_transaction_id`
- `ensureStudentExists()`: busca por e-mail em `auth.users`; cria conta se não existir
- `upsertPurchase()`: INSERT para nova compra, UPDATE para reativação ou cancelamento/reembolso
- `notifyStudent()`: execução paralela e fire-and-forget; falha não reverte a compra

### Variações de Comportamento

- Stripe usa `STRIPE_WEBHOOK_SECRET` global de ambiente; produto identificado via `metadata.product_id`
- Demais plataformas: `product_id` na query string; secret buscado em `products.webhook_secret`
- Tier 1: Stripe (HMAC-SHA256 via lib oficial), Kiwify (HMAC-SHA1 no raw body), Hotmart (timingSafeEqual)
- Tier 2: `GenericValidator` com timingSafeEqual para Monetizze, Eduzz, Paddle (dívida técnica)
- Reativação: compra `cancelled`/`refunded` recebe novo `approved` com `external_transaction_id` diferente
- Replay attack Stripe: timestamp do `stripe-signature` com tolerância superior a 300s retorna 400

### Contratos Públicos

- Interface `WebhookValidator` com métodos `validate()` e `parseEvent()`
- Interface `WebhookEvent` com campos: `externalTransactionId`, `customerEmail`, `amount`, `currency`, `status`, `platform`, `rawPayload`
- Tabela `webhook_logs`: `received_at`, `platform`, `raw_headers`, `raw_body`, `validation_result`, `processing_result`, `expires_at`
- Coluna `currency` em `purchases` para suporte a ISO 4217 (EUR, USD, BRL e outros)

---

## Diagramas

### Fluxo Principal (Plataformas não-Stripe)

Este diagrama de sequência representa o caminho feliz completo de um webhook de plataforma não-Stripe, desde o POST inicial até o retorno 200. Cobre as etapas de validação HMAC, criação do log de auditoria, verificação de idempotência, criação de aluno e persistência da compra em sequência. As notificações são disparadas de forma assíncrona após o retorno 200, evidenciando o padrão fire-and-forget que isola falhas de notificação do fluxo principal. Este diagrama é o ponto de entrada mais importante para compreender como todos os componentes se integram.

```mermaid
sequenceDiagram
    participant P as Plataforma
    participant WP as webhook-payment
    participant DB as PostgreSQL
    participant Auth as Auth Admin API
    participant Notif as Notificacoes

    P->>WP: POST ?product_id=X&platform=Y
    WP->>DB: SELECT products (webhook_secret)
    DB-->>WP: webhook_secret
    WP->>WP: validate HMAC (rawBody)
    WP->>DB: INSERT webhook_logs
    WP->>WP: parseEvent (status normalizado)
    WP->>DB: SELECT purchases (idempotencia)
    DB-->>WP: nao existe
    WP->>Auth: createUser (se novo)
    Auth-->>WP: user_id
    WP->>DB: INSERT purchases
    WP->>DB: UPDATE webhook_logs (resultado)
    WP-->>P: 200 OK
    WP-)Notif: POST send-purchase-confirmation
```

**Notas**:
- `rawBody` lido como `Uint8Array` antes de qualquer parse JSON; nunca convertido antes da validação HMAC
- `webhook_logs` é inserido antes de qualquer operação de negócio; toda falha parcial é auditável
- A seta `-)` representa chamada assíncrona fire-and-forget; falha em `Notif` não reverte a compra
- Se o aluno já existe em `auth.users`, `ensureStudentExists` pula a criação e avança

---

### Fluxo Stripe

Este diagrama de sequência cobre o fluxo específico do Stripe, que difere das demais plataformas em dois aspectos críticos: o secret de validação vem de variável de ambiente (`STRIPE_WEBHOOK_SECRET` global) e o `product_id` é extraído de `metadata.product_id` dentro do evento já validado, não da query string. O replay attack é bloqueado na fase de validação quando o timestamp do `stripe-signature` excede 300 segundos de tolerância. Compreender este fluxo separado é essencial porque a ordem das operações muda: a busca de produto acontece após a validação, não antes.

```mermaid
sequenceDiagram
    participant S as Stripe
    participant WP as webhook-payment
    participant DB as PostgreSQL
    participant Auth as Auth Admin API
    participant Notif as Notificacoes

    S->>WP: POST ?platform=stripe
    WP->>WP: validate stripe-signature
    Note over WP: STRIPE_WEBHOOK_SECRET do ambiente
    Note over WP: rejeita se timestamp maior que 300s
    WP->>WP: parseEvent (extrair metadata)
    WP->>DB: SELECT products (via metadata.product_id)
    DB-->>WP: produto encontrado
    WP->>DB: INSERT webhook_logs
    WP->>DB: SELECT purchases (idempotencia)
    DB-->>WP: nao existe
    WP->>Auth: createUser (se novo)
    Auth-->>WP: user_id
    WP->>DB: INSERT purchases (com currency)
    WP->>DB: UPDATE webhook_logs (resultado)
    WP-->>S: 200 OK
    WP-)Notif: POST send-purchase-confirmation
```

**Notas**:
- `STRIPE_WEBHOOK_SECRET` global de conta; não há `product_id` na query string para Stripe
- Produto identificado via `event.data.object.metadata.product_id` após validação bem-sucedida
- Replay attack: Stripe SDK rejeita eventos com timestamp superior a 300s antes de qualquer operação de DB
- Campo `currency` em `purchases` persiste o código ISO 4217 do evento (ex: `EUR` para conta europeia)

---

### Validação e Roteamento Inicial

Este fluxograma representa as decisões de roteamento e validação que ocorrem antes da inserção do `webhook_log`, correspondendo aos passos 2 e 3 do fluxo principal. A lógica de early-exit é central para a segurança: plataformas desconhecidas e assinaturas inválidas são rejeitadas sem nenhum registro em banco de dados, o que evita poluição de auditoria com tentativas inválidas. Cada ramificação tem uma resposta HTTP específica, tornando este diagrama útil como referência rápida para diagnóstico de erros 400.

```mermaid
flowchart TD
    A[POST recebido] --> B{platform valido?}
    B -->|nao| C[400 unknown_platform]
    B -->|sim| D[Seleciona Validator]
    D --> E{Stripe?}
    E -->|sim| F[secret do ambiente]
    E -->|nao| G[SELECT products]
    G --> H{produto existe?}
    H -->|nao| I[INSERT webhook_logs]
    I --> J[400 product_not_found]
    H -->|sim| K[obtem webhook_secret]
    F --> L[validate HMAC]
    K --> L
    L --> M{HMAC valido?}
    M -->|nao| N[400 invalid_signature]
    M -->|sim| O[INSERT webhook_logs]
    O --> P[parseEvent]
```

**Notas**:
- `platform` desconhecido retorna 400 sem inserir `webhook_log`
- HMAC inválido retorna 400 sem inserir `webhook_log`; replay attack Stripe também retorna 400 aqui
- Para plataformas não-Stripe, `product_not_found` resulta em INSERT de `webhook_log` antes do 400
- `webhook_secret` nunca logado nem retornado em resposta

---

### Arquitetura Plugin de Validadores

Este fluxograma de comparação lateral ilustra a separação entre Tier 1 e Tier 2 na arquitetura plugin, mostrando como cada plataforma conecta ao core de processamento através da interface `WebhookValidator`. A divisão é relevante porque indica claramente onde está a dívida técnica (Tier 2) e quais plataformas possuem HMAC real (Tier 1). Adicionar uma nova plataforma requer apenas implementar `WebhookValidator` e registar no mapa; o core permanece inalterado.

```mermaid
flowchart LR
    subgraph Core["Core de Processamento"]
        WP[webhook-payment]
    end

    subgraph Mapa["Mapa de Validadores"]
        direction TB
        subgraph T1["Tier 1 (HMAC real)"]
            SV[StripeValidator<br/>HMAC-SHA256]
            KV[KiwifyValidator<br/>HMAC-SHA1]
            HV[HotmartValidator<br/>timingSafeEqual]
        end
        subgraph T2["Tier 2 (divida tecnica)"]
            GV[GenericValidator<br/>timingSafeEqual]
        end
    end

    subgraph Plataformas["Plataformas"]
        ST[Stripe]
        KI[Kiwify]
        HO[Hotmart]
        MO[Monetizze]
        ED[Eduzz]
        PA[Paddle]
    end

    ST --> SV
    KI --> KV
    HO --> HV
    MO --> GV
    ED --> GV
    PA --> GV

    SV --> WP
    KV --> WP
    HV --> WP
    GV --> WP
```

**Notas**:
- Tier 1: Stripe usa lib oficial npm; Kiwify usa HMAC-SHA1 no `rawBody` como `Uint8Array`; Hotmart usa comparação de tempo constante
- Tier 2: `GenericValidator` usa header `x-webhook-signature` com `timingSafeEqual`; HMAC real é dívida técnica para iteração seguinte
- `products.webhook_secret` alimenta todos os validadores exceto Stripe (que usa variável de ambiente)
- Nova plataforma: implementar `WebhookValidator`, registar no mapa; zero alteração no core

---

### Idempotência e Reativação de Compra

Este fluxograma representa a lógica de `checkIdempotency` e `upsertPurchase`, que é o coração da garantia de segurança contra duplicatas e retries das plataformas. O diagrama evidencia três caminhos distintos: compra nova, duplicata idempotente (retorna 200 sem ação) e reativação (compra cancelada/reembolsada recebe novo `approved` com `external_transaction_id` diferente). Este é um dos aspectos mais não-óbvios do sistema, pois o tratamento de reativação usa UPDATE em vez de INSERT e lookup por `(user_id, product_id)`.

```mermaid
flowchart TD
    START[evento recebido] --> A{tipo do evento?}
    A -->|approved| B[checkIdempotency]
    A -->|cancelled ou refunded| M[UPDATE purchases<br/>status revogado]
    M --> N[acesso revogado via RLS]
    N --> Z[200 OK]
    B --> C{existe purchase<br/>com mesmo ID?}
    C -->|nao| I[INSERT purchases<br/>com currency]
    C -->|sim| D{status atual?}
    D -->|approved| E[200 already_exists]
    D -->|cancelled ou refunded| H[UPDATE purchases<br/>novo ID e valor]
    I --> K[200 purchase_created]
    H --> L[200 purchase_reactivated]
```

**Notas**:
- Idempotência garantida por `UNIQUE(external_transaction_id)` em `purchases`
- Reativação usa UPDATE em `purchases` por `(user_id, product_id)`; `external_transaction_id` e `amount_paid` são atualizados
- Cancelamento/reembolso: RLS avaliada em tempo real no PostgreSQL; sem cache de sessão a invalidar
- Dois requests simultâneos com mesmo ID: o segundo falha na constraint UNIQUE e retorna 500; retry encontra idempotência

---

### Criação de Aluno (ensureStudentExists)

Este fluxograma detalha a lógica de `ensureStudentExists`, que é executada após a verificação de idempotência e antes do `upsertPurchase`. A decisão de não enviar link de recovery é um invariante crítico: o e-mail de confirmação de compra contém as instruções de acesso. Outro ponto não-óbvio é o tratamento de role: se o e-mail já pertence a um admin, o role não é alterado, evitando downgrade acidental de privilégios.

```mermaid
flowchart TD
    A[ensureStudentExists] --> B[busca por email<br/>em auth.users]
    B --> C{usuario existe?}
    C -->|nao| D[createUser<br/>email_confirm true]
    D --> E[trigger handle_new_user]
    E --> F[role = user<br/>via profiles]
    C -->|sim| I{role atual?}
    I -->|admin| J[nao altera role]
    I -->|user| K[nenhuma acao]
    F --> L[avanca para upsertPurchase]
    J --> L
    K --> L
    D -.->|falha| M[500 log error<br/>purchase nao inserida]
```

**Notas**:
- `createUser` chamado com `email_confirm: true`; sem envio de link de recovery
- Trigger `handle_new_user` cria automaticamente `profiles` e `user_roles` com `role = 'user'`
- Admin preexistente: role não é alterado para evitar downgrade acidental de privilégios
- Falha em `createUser` retorna 500; a plataforma retenta com backoff exponencial

---

### Contratos da Arquitetura Plugin

Este diagrama de classes expõe as duas interfaces TypeScript internas que definem o contrato da arquitetura plugin: `WebhookValidator` e `WebhookEvent`. São os únicos contratos que cada implementador de nova plataforma precisa respeitar. A relação entre as interfaces e os validadores concretos mostra como Tier 1 e Tier 2 implementam o mesmo contrato, e como `WebhookEvent` é o tipo normalizado que o core de processamento consome independente da plataforma.

```mermaid
classDiagram
    class WebhookValidator {
        <<interface>>
        +validate(req, rawBody, secret) Promise~boolean~
        +parseEvent(rawBody) WebhookEvent
    }

    class WebhookEvent {
        +externalTransactionId string
        +externalProductId string
        +customerEmail string
        +customerName string
        +amount number
        +currency string
        +status string
        +platform string
        +rawPayload unknown
    }

    class StripeValidator {
        <<Tier 1>>
        +validate() HMAC-SHA256
        +parseEvent() WebhookEvent
    }

    class KiwifyValidator {
        <<Tier 1>>
        +validate() HMAC-SHA1
        +parseEvent() WebhookEvent
    }

    class HotmartValidator {
        <<Tier 1>>
        +validate() timingSafeEqual
        +parseEvent() WebhookEvent
    }

    class GenericValidator {
        <<Tier 2>>
        +validate() timingSafeEqual
        +parseEvent() WebhookEvent
    }

    WebhookValidator <|.. StripeValidator
    WebhookValidator <|.. KiwifyValidator
    WebhookValidator <|.. HotmartValidator
    WebhookValidator <|.. GenericValidator
    WebhookValidator --> WebhookEvent
```

**Notas**:
- `status` em `WebhookEvent` é sempre normalizado para `approved`, `cancelled` ou `refunded`
- `currency` segue ISO 4217 (`EUR`, `USD`, `BRL` e outros); persistido em `purchases.currency`
- `rawPayload` é o payload bruto da plataforma; persistido em `webhook_logs.raw_body`
- `GenericValidator` aceita Monetizze, Eduzz e Paddle; HMAC real é dívida técnica registada

---

### Ciclo de Vida do webhook_log e Purga

Este fluxograma representa o ciclo de vida completo de um registro em `webhook_logs`, desde a inserção inicial até a purga automática pelo pg_cron. A coluna `expires_at` é gerada automaticamente como `received_at + 30 days`, eliminando a possibilidade de registros sem TTL. O diagrama também ilustra o fallback para ambientes sem pg_cron (plano Supabase Free), onde a purga é feita por Edge Function agendada.

```mermaid
flowchart TD
    A[webhook recebido] --> B[INSERT webhook_logs]
    B --> C[expires_at gerado<br/>received_at + 30d]
    C --> D[atualizacoes durante<br/>processamento]
    D --> E{admin acessa<br/>painel?}
    E -->|sim| F[SELECT via RLS<br/>apenas seu produto]
    E -->|nao| G[registro aguarda TTL]
    F --> G
    G --> H{pg_cron disponivel?}
    H -->|sim Pro| I[job diario 3h UTC]
    H -->|nao Free| J[Edge Function agendada]
    I --> K[DELETE WHERE<br/>expires_at menor now]
    J --> K
    K --> L[registro removido]
```

**Notas**:
- `expires_at` é coluna gerada (`GENERATED ALWAYS AS`) e nunca editável manualmente
- RLS em `webhook_logs`: admin vê apenas logs dos seus produtos via `product_id -> products.admin_id`
- INSERT e UPDATE apenas via Service Role Key da Edge Function; DELETE apenas via pg_cron ou Service Role
- `raw_body` contém PII (e-mail, nome); TTL 30 dias e RLS restritiva são a mitigação em v1.0
- Fallback Free: mesma instrução SQL de purga executada por Supabase Scheduled Functions
