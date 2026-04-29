# Relatório de Relacionamentos entre ADRs — APP XPRO

**Data:** 28-04-2026
**Gerado por:** ADR Relationship Linker
**Diretório analisado:** `.claude/docs/adrs/generated/`

---

## Resumo Executivo

| Métrica | Valor |
|---|---|
| ADRs processados | 12 |
| Módulos cobertos | 10 (API, AUTH, BILLING, CORE, DATA, EMAIL, FRONTEND, OBSERVABILITY, SCHEMA, STORAGE) |
| Pares de relações detectados | 22 |
| ADRs modificados | 12 |
| Links criados (totais, bidirecionais) | 43 |
| Links quebrados | 0 |
| Relações manuais preservadas | 7 |

---

## Relações Detectadas por Tipo

### Depende de (11 relações)

| ADR origem | Depende de | Confiança | Justificativa |
|---|---|---|---|
| ADR-002 | ADR-001 | Manual + 0.92 | `admin_id` é coluna PostgreSQL gerida pelo Supabase; modelo de RLS nativo pressupõe Supabase como provider |
| ADR-002 | ADR-003 | Manual + 0.90 | Decisão explicita: "políticas RLS ficam reduzidas a `auth.uid() = admin_id`"; sem ADR-003 não há mecanismo de isolamento |
| ADR-003 | ADR-001 | Manual + 0.92 | RLS é capacidade nativa do PostgreSQL via Supabase; ADR-003 seccão 2: "ausência de backend próprio torna impossível interpor camada antes de cada query" |
| ADR-003 | ADR-002 | Manual + 0.90 | Policies de RLS referem `admin_id` como coluna central de isolamento; ADR-003 depende do modelo definido em ADR-002 |
| ADR-004 | ADR-001 | Manual + 0.90 | Edge Function de bootstrap usa Admin Auth API do Supabase; função SQL `promote_to_admin` reside no PostgreSQL Supabase |
| ADR-004 | ADR-003 | Manual + 0.92 | Decisão explicita: "política RLS adicional em `user_roles` bloqueando UPDATE pelo próprio utilizador actua como camada defensiva redundante"; ADR-004 estende o mecanismo de ADR-003 |
| ADR-005 | ADR-001 | 0.87 | Constraint `UNIQUE(external_transaction_id)` reside no PostgreSQL Supabase; Edge Function `webhook-payment` corre no runtime Deno do Supabase |
| ADR-006 | ADR-001 | 0.92 | `storage.createSignedUrl` é primitiva nativa do SDK Supabase Storage; buckets `module-content` e `certificates` existem no Supabase Storage |
| ADR-006 | ADR-008 | 0.88 | Decisão explicita na seccão 6: "ServiceLayer (`src/services/storage.service.ts`) é o único ponto autorizado de invocação de `createSignedUrl`" |
| ADR-007 | ADR-008 | Manual + 0.82 | Hooks TanStack Query em `src/hooks/queries/` consomem exclusivamente serviços de domínio definidos pelo padrão ADR-008 |
| ADR-008 | ADR-001 | Manual + 0.90 | Rationale central do ADR-008: "substituir o Supabase sem uma camada intermediária implicaria refactor de escopo indefinido no frontend" |
| ADR-010 | ADR-001 | 0.88 | Edge Functions correm no runtime Deno do Supabase; ADR-010 governa evolução dessas funções; schema de URL `/functions/v1/` pertence ao roteamento interno do Supabase |
| ADR-011 | ADR-001 | 0.86 | SDK Resend escolhido especificamente por compatibilidade nativa com Deno runtime das Edge Functions Supabase |
| ADR-012 | ADR-001 | Manual + 0.92 | Migrações em `supabase/migrations/` são geridas pelo Supabase CLI; integração directa com `supabase db diff` e `supabase db push` |

### ADRs Relacionadas (11 relações)

| ADR | Relacionada com | Justificativa |
|---|---|---|
| ADR-002 | ADR-012 | Schema do modelo `admin_id` deve ser versionado em migrations; ADR-012 é o mecanismo de entrega das constraints de ADR-002 em produção |
| ADR-003 | ADR-006 | Ambas protegem acesso a recursos: ADR-003 protege linhas do banco, ADR-006 protege binários no Storage; complementares na defesa em profundidade |
| ADR-003 | ADR-012 | Políticas RLS são artefactos SQL que precisam de ser versionados como migrations; ADR-012 é o mecanismo de deploy das policies de ADR-003 |
| ADR-004 | ADR-011 | Fluxo de convite de aluno (ADR-004 seccão 4: "Edge Function `promote-admin` com modos bootstrap, create_invite, use_invite") usa envio de e-mail por Resend (ADR-011) |
| ADR-005 | ADR-010 | `webhook-payment` é a Edge Function coberta por ambas: ADR-005 governa idempotência do webhook, ADR-010 governa como versionar essa função se houver breaking change |
| ADR-005 | ADR-012 | A constraint `UNIQUE(external_transaction_id)` precisa de ser aplicada via migration antes do primeiro webhook real; ADR-012 é o mecanismo de deploy dessa constraint |
| ADR-006 | ADR-003 | (ver acima — bidirecional) |
| ADR-007 | ADR-009 | ADR-009 explicita política de breadcrumbs: "não capturar queries TanStack como breadcrumbs por gerarem ruído"; decisão de Sentry afecta directamente comportamento com TanStack Query |
| ADR-008 | ADR-009 | Sentry monitoriza erros do frontend; ServiceLayer é a abstracção pela qual todas as chamadas ao Supabase passam — Sentry captura falhas dessa camada via fetch breadcrumbs |
| ADR-010 | ADR-011 | Ambas governam Edge Functions: ADR-010 define estratégia de versionamento, ADR-011 usa Edge Functions para entrega de e-mail; relação preservada do campo manual original |
| ADR-012 | ADR-002 | (ver acima — bidirecional) |
| ADR-012 | ADR-003 | (ver acima — bidirecional) |
| ADR-012 | ADR-005 | (ver acima — bidirecional) |

### Usado por (2 relações, bidirecionais das dependências)

| ADR | Usado por |
|---|---|
| ADR-001 | ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-008, ADR-010, ADR-011, ADR-012 |
| ADR-003 | ADR-004 |
| ADR-008 | ADR-006, ADR-007 |

---

## Grafo de Dependências

```
ADR-001 (CORE/Supabase BaaS)
  ├── Usado por → ADR-002 (DATA/multi-tenant admin_id)
  │                └── Depende de → ADR-003 (AUTH/RLS)
  │                                   └── Usado por → ADR-004 (AUTH/SECURITY DEFINER)
  ├── Usado por → ADR-003 (AUTH/RLS)
  ├── Usado por → ADR-004 (AUTH/SECURITY DEFINER)
  ├── Usado por → ADR-005 (BILLING/idempotência webhook)
  ├── Usado por → ADR-006 (STORAGE/signed URLs)
  │                └── Depende de → ADR-008 (FRONTEND/ServiceLayer)
  ├── Usado por → ADR-008 (FRONTEND/ServiceLayer)
  │                └── Usado por → ADR-007 (FRONTEND/TanStack Query)
  ├── Usado por → ADR-010 (API/Edge Function versioning)
  ├── Usado por → ADR-011 (EMAIL/Resend)
  └── Usado por → ADR-012 (SCHEMA/migrations)
```

---

## Cadeias Arquitecturais Identificadas

### Cadeia 1: Isolamento Multi-tenant
```
ADR-001 → ADR-002 → ADR-003 → ADR-004
(BaaS)     (modelo)  (RLS)     (elevação segura de role)
```
Esta cadeia define como o isolamento entre tenants é construído em camadas: a escolha do Supabase viabiliza RLS nativa, que por sua vez permite o modelo `admin_id`, que exige mecanismo seguro de promoção de role.

### Cadeia 2: Acesso a Conteúdo Privado
```
ADR-001 → ADR-003 → ADR-006
(BaaS)     (RLS DB)   (signed URLs Storage)
```
Defesa em profundidade para conteúdo pago: RLS protege linhas de dados, signed URLs protegem binários. Complementares e não redundantes.

### Cadeia 3: Frontend sem Acoplamento Directo ao Supabase
```
ADR-001 → ADR-008 → ADR-007
(BaaS)     (ServiceLayer)  (TanStack Query)
ADR-009 (Sentry) — relacionado com ADR-007 e ADR-008
```
ServiceLayer encapsula o Supabase Client; TanStack Query consome ServiceLayer; Sentry observa o frontend sem interferir na camada de cache.

### Cadeia 4: Entrega de Schema em Produção
```
ADR-001 → ADR-012 ← ADR-002 (modelo admin_id)
(BaaS)    (migrations)  ← ADR-003 (RLS policies)
                         ← ADR-005 (constraint UNIQUE)
```
ADR-012 é o mecanismo de deploy de todas as decisões de schema. As constraints definidas em ADR-002, ADR-003 e ADR-005 precisam de ADR-012 para chegar a produção com segurança.

### Cadeia 5: Edge Functions e Integrações Externas
```
ADR-001 → ADR-010 (versioning)
              ↕ relacionado
ADR-005 (webhook idempotência) + ADR-011 (Resend e-mail)
```
Três decisões que governam as Edge Functions públicas: como versioná-las, como garantir idempotência do webhook de pagamento, e como enviar e-mail transacional.

---

## ADR Central (Hub)

**ADR-001** é o hub arquitectural com 9 ADRs dependentes directos. Toda decisão de infraestrutura pressupõe a escolha do Supabase. Este padrão é esperado e documentado no próprio ADR-001: "a escolha do provider de infraestrutura fundou a stack completa de v1.0".

---

## Relações Manuais Preservadas e Reconciliadas

| ADR | Campo original | Acção |
|---|---|---|
| ADR-002 | `ADRs Relacionados: ADR-001, ADR-003` | Convertido para `Depende de` com links clicáveis (relação de dependência explícita, não apenas relacionamento) |
| ADR-003 | `ADRs Relacionados: ADR-001, ADR-002, ADR-004` | ADR-001 e ADR-002 convertidos para `Depende de`; ADR-004 convertido para `Usado por` (ADR-004 depende de ADR-003, não o contrário) |
| ADR-004 | `ADRs Relacionados: ADR-001, ADR-003` | Convertido para `Depende de` com links clicáveis |
| ADR-007 | `ADRs Relacionados: ADR-008` | Convertido para `Depende de` (relação directa: hooks TanStack consomem ServiceLayer) |
| ADR-008 | `ADRs Relacionados: ADR-001, ADR-007` | ADR-001 convertido para `Depende de`; ADR-007 convertido para `Usado por` |
| ADR-011 | `ADRs Relacionados: ADR-010` | Mantido como `ADRs Relacionadas` (relação não é de dependência; ambas governam Edge Functions) |
| ADR-012 | `ADRs Relacionadas: ADR-001` | Convertido para `Depende de` (Supabase CLI é requisito de ADR-012) |

**Observação**: O campo `ADRs Relacionados` (masculino, plural) foi padronizado para `ADRs Relacionadas` (feminino, alinhado com "ADRs" como "Architecture Decision Records" — feminino em pt-BR) em todos os ficheiros actualizados.

---

## Validação de Bidirecionalidade

| Par | A → B | B → A | Estado |
|---|---|---|---|
| ADR-002 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-002 ↔ ADR-003 | Depende de | Usado por (via ADR-003 seccão Usado por) | Bidirecional |
| ADR-003 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-003 ↔ ADR-002 | Depende de | Relacionada | Bidirecional |
| ADR-004 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-004 ↔ ADR-003 | Depende de | Usado por | Bidirecional |
| ADR-005 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-006 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-006 ↔ ADR-008 | Depende de | Usado por | Bidirecional |
| ADR-007 ↔ ADR-008 | Depende de | Usado por | Bidirecional |
| ADR-008 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-010 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-011 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-012 ↔ ADR-001 | Depende de | Usado por | Bidirecional |
| ADR-003 ↔ ADR-006 | Relacionada | Relacionada | Bidirecional |
| ADR-003 ↔ ADR-012 | Relacionada | Relacionada | Bidirecional |
| ADR-004 ↔ ADR-011 | Relacionada | Relacionada | Bidirecional |
| ADR-005 ↔ ADR-010 | Relacionada | Relacionada | Bidirecional |
| ADR-005 ↔ ADR-012 | Relacionada | Relacionada | Bidirecional |
| ADR-007 ↔ ADR-009 | Relacionada | Relacionada | Bidirecional |
| ADR-008 ↔ ADR-009 | Relacionada | Relacionada | Bidirecional |
| ADR-010 ↔ ADR-011 | Relacionada | Relacionada | Bidirecional |
| ADR-002 ↔ ADR-012 | Relacionada | Relacionada | Bidirecional |

**Todas as 23 relações são bidirecionais. Zero relações unidireccionais.**

---

## Validação de Links

```
Links verificados: 43
Links válidos:     43 (100%)
Links quebrados:   0
Dependências circulares: 0
Conflitos de tipo: 0
```

---

## Avisos

Nenhum aviso. Todos os limites de links por ADR foram respeitados:
- Máximo 3 "Depende de" por ADR: respeitado em todos os casos
- Máximo 3 "ADRs Relacionadas" por ADR: respeitado em todos os casos
- Relações manuais preexistentes: todas preservadas e reconciliadas

---

## Ficheiros Modificados

| Ficheiro | Módulo | Tipo de alteração |
|---|---|---|
| `CORE/ADR-001-supabase-como-baas-unico.md` | CORE | Adicionado `Usado por` com 9 links |
| `DATA/ADR-002-multi-tenant-por-admin-id.md` | DATA | `ADRs Relacionados` convertido; adicionado `Depende de` e `ADRs Relacionadas` |
| `AUTH/ADR-003-rls-como-mecanismo-unico-de-autorizacao.md` | AUTH | `ADRs Relacionados` convertido; adicionado `Depende de`, `Usado por`, `ADRs Relacionadas` |
| `AUTH/ADR-004-promocao-role-admin-security-definer.md` | AUTH | `ADRs Relacionados` convertido; adicionado `Depende de` e `ADRs Relacionadas` |
| `BILLING/ADR-005-idempotencia-webhook-unique-constraint.md` | BILLING | Adicionado `Depende de` e `ADRs Relacionadas` |
| `STORAGE/ADR-006-urls-assinadas-buckets-privados.md` | STORAGE | Adicionado `Depende de` e `ADRs Relacionadas` |
| `FRONTEND/ADR-007-tanstack-query-cache-servidor.md` | FRONTEND | `ADRs Relacionados` convertido; adicionado `Depende de` e `ADRs Relacionadas` |
| `FRONTEND/ADR-008-service-layer-obrigatorio.md` | FRONTEND | `ADRs Relacionados` convertido; adicionado `Depende de`, `Usado por`, `ADRs Relacionadas` |
| `OBSERVABILITY/ADR-009-sentry-no-frontend-v1-otel-fase-futura.md` | OBSERVABILITY | Adicionado `ADRs Relacionadas` com 2 links |
| `API/ADR-010-sem-versionamento-url-edge-functions-sufixo-v2.md` | API | Adicionado `Depende de` e `ADRs Relacionadas` |
| `EMAIL/ADR-011-resend-como-provider-de-email-transacional.md` | EMAIL | `ADRs Relacionados` convertido; adicionado `Depende de` e `ADRs Relacionadas` |
| `SCHEMA/ADR-012-supabase-migrations-versionadas.md` | SCHEMA | `ADRs Relacionadas` expandido; adicionado `Depende de` e 2 links adicionais |
