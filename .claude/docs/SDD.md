# Security Design Doc — APP XPRO

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-29  
**Autor:** André dos Reis  

---

## 1. Contexto e âmbito

O APP XPRO é uma plataforma SaaS multi-tenant para cursos online. Este documento consolida o modelo de segurança da plataforma em v1.0: autenticação, autorização, isolamento entre tenants, prevenção de escalada de privilégios, segurança de Storage, validação de webhooks, hardening do frontend, gestão de segredos, observabilidade forense e resposta a incidentes.

O SDD não duplica os ADRs, FDDs ou o HLD; consolida-os numa vista única navegável e fecha decisões pequenas que não justificam ADR próprio (CORS, X-Frame-Options, CSP). Documentos de referência:

- HLD (Riscos 2 escalada de privilégios, 3 webhook secret global, 4 cross-tenant leak, 8 storage URL leak)
- ADR-003 (RLS como autorização), ADR-004 (SECURITY DEFINER), ADR-006 (signed URLs), ADR-009 (Sentry PII)
- FDD-001 (admin invite + hCaptcha + bootstrap), FDD-002 (validators de webhook), FDD-004 (RLS de Storage para certificados), FDD-005 (RLS admin em user_progress)

**Fora do âmbito:**
- Pen-testing (não realizado em v1.0; planeado pre-revenue)
- Certificações formais (ISO 27001, SOC 2 Type II)
- DRM, geo-fencing, fingerprinting de dispositivo
- Compliance GDPR completo (LGPD light cobre v1.0; GDPR escala quando volume EU justificar)
- Bug bounty (alvo v2.0)

---

## 2. Modelo de ameaças

Top-9 ameaças com probabilidade, impacto, mitigação activa e risco residual. Alinhadas com o tom de Riscos do HLD.

### T1: Escalada de privilégios via UPDATE client-side em `user_roles`

**Probabilidade:** alta (vulnerabilidade activa em v0)  
**Impacto:** crítico; qualquer aluno torna-se admin; controlo total de produtos de outros admins  
**Mitigação:** ADR-004 + FDD-001 implementam `promote_to_admin` SQL `SECURITY DEFINER` + Edge Function `promote-admin` para bootstrap + RLS bloqueando UPDATE em `user_roles` pelo próprio utilizador  
**Risco residual:** baixo após implementação; bootstrap token requer rotação após primeira utilização

### T2: Cross-tenant data leak por RLS mal configurada

**Probabilidade:** média (sem testes automatizados de isolamento em v1.0)  
**Impacto:** crítico; vazamento entre admins destrói confiança e implica notificação LGPD em 72 h (Art. 48)  
**Mitigação:** RLS activa em todas as tabelas com dados sensíveis (ADR-003); auditoria por release; checklist obrigatória em PR template (a criar); três cenários de teste manual obrigatórios por tabela (leitura, escrita, delete cruzada) até suite automatizada estar mergeada  
**Risco residual:** médio em v1.0 (manual); baixo após suite automatizada

### T3: Webhook forging por secret comprometido

**Probabilidade:** média (estado actual: secret global compartilhado entre todos os admins)  
**Impacto:** alto; atacante forja compras aprovadas em qualquer produto de qualquer admin  
**Mitigação:** estado alvo HLD Risco 3: migrar para `products.webhook_secret` per produto; estado v1.0: secret global em env var Supabase, rotação obrigatória em incidente; HMAC validation por plataforma (FDD-002)  
**Risco residual:** médio em v1.0; baixo após per-product secret

### T4: Vazamento de URL assinada de Storage privado

**Probabilidade:** baixa-média  
**Impacto:** alto; PDFs vendidos acessíveis a quem não pagou; certificados expõem PII  
**Mitigação:** ADR-006 TTL curto (3600 s PDFs, 300 s certificados); ServiceLayer único ponto de geração; bucket RLS por prefixo `user_id` (FDD-004 §5.3); URL nunca cacheada no cliente (`staleTime: 0`)  
**Risco residual:** baixo (TTL limita janela)

### T5: SQL injection ou bypass de RLS via input não sanitizado

**Probabilidade:** baixa (Supabase JS Client parametriza; sem SQL string concat no código actual)  
**Impacto:** crítico se materializar  
**Mitigação:** uso exclusivo do client tipado; sem string interpolation em queries; ServiceLayer encapsula (ADR-008); code review obrigatório  
**Risco residual:** baixo

### T6: XSS em descrições de produto/módulo (HTML user-generated)

**Probabilidade:** baixa-média (admins editam descrições com HTML rico)  
**Impacto:** alto; admin malicioso injecta script que rouba sessões de alunos  
**Mitigação:** `dompurify` (já em deps) sanitiza HTML antes de render; nunca usar `dangerouslySetInnerHTML` sem dompurify; CSP `script-src` restrito  
**Risco residual:** baixo após enforcement em code review (regra a adicionar ao PR template)

### T7: Service-role key vazada em log/repo/build artifact

**Probabilidade:** baixa (key nunca exposta a frontend; armazenada em env Supabase)  
**Impacto:** crítico; bypass total de RLS; acesso a dados de todos os admins  
**Mitigação:** key apenas em Edge Functions; `.env*` no `.gitignore`; CI verifica ausência da string em diff; Sentry filtra por regex em `beforeSend`  
**Risco residual:** baixo

### T8: Comprometimento de conta admin via password fraca + ausência de 2FA

**Probabilidade:** média  
**Impacto:** alto; controlo total dos produtos do admin afectado  
**Mitigação v1.0:** Supabase Auth password policy mínima (configurar para >=10 chars, mistura); rate limit nativo (5/60s/IP); recovery por e-mail apenas para reset password  
**Risco residual:** médio em v1.0 (sem 2FA); baixo após introdução de 2FA TOTP (alvo v1.x)

### T9: DoS por flood em endpoints públicos (webhook-payment, signup)

**Probabilidade:** baixa  
**Impacto:** médio (degrada experiência mas não compromete dados)  
**Mitigação:** rate limit nativo Supabase Auth; rate limit por IP em `webhook-payment` (FDD-002); hCaptcha em `signup` e `use_invite` (FDD-001); plano Pro do Supabase com limites globais maiores  
**Risco residual:** baixo

---

## 3. Autenticação

### 3.1 Provider e fluxos

Supabase Auth é o provider único de identidade em v1.0. Fluxos suportados:

| Fluxo | Implementação | Estado |
|---|---|---|
| Signup admin | `auth.signUp` + Edge Function `promote-admin` (FDD-001) com bootstrap token | ✅ alvo |
| Signup aluno | Sempre via convite de admin; nunca self-service | ✅ |
| Login | `auth.signInWithPassword` (PKCE) | ✅ |
| Recovery password | `auth.resetPasswordForEmail` | ✅ |
| Convite de aluno | `auth.admin.createUser` + Resend e-mail (FDD-001) | ✅ |
| Convite de admin | Edge Function `admin-invite` + token único + hCaptcha (FDD-001) | ⏳ |

### 3.2 Tokens

- **JWT access token:** expiração 3600 s (default Supabase). Cliente faz refresh automático via SDK.
- **Refresh token:** rotacionado a cada uso. Armazenado pelo Supabase JS em `localStorage` por default em v1.0; alvo v1.x considera cookie `httpOnly` para reduzir superfície XSS.
- **Recovery token:** TTL 24 h (default Supabase Auth); single-use.
- **Bootstrap admin token:** env var no Supabase; deve ser invalidada após primeira utilização produtiva. Rotação manual em incidente.
- **Webhook secret:** estado actual env var global; estado alvo `products.webhook_secret` per produto (HLD Risco 3, FDD-002).

### 3.3 Password policy

- Comprimento mínimo: configurar Supabase para >= 10 caracteres.
- Diversidade: ao menos 1 letra maiúscula, 1 minúscula, 1 dígito.
- Comprometido: Supabase Auth verifica HIBP automaticamente no signup/recovery (feature nativa, activar no dashboard).
- Reset: token único TTL 24 h; password antiga não pode ser reutilizada (configurar no dashboard).

### 3.4 2FA / MFA

Fora do âmbito v1.0. Alvo v1.x: TOTP via Supabase Auth MFA nativo, obrigatório para role admin, opcional para aluno.

---

## 4. Autorização

### 4.1 Modelo: defense in depth com RLS no centro

```
┌──────────────────────────────────────────────────┐
│ Frontend (ProtectedRoute = UX, não segurança)    │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│ ServiceLayer (auditoria; sem checks de auth)     │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│ Supabase JS Client (passa JWT no header)         │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│ PostgREST (Supabase API gateway)                 │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│ PostgreSQL com RLS (ADR-003: autoridade única)   │
└──────────────────────────────────────────────────┘
```

ADR-003 documenta a decisão. RLS é o único guardião com efeito de segurança real; todas as outras camadas são desempenho ou UX.

### 4.2 Sistema de roles

Roles em `user_roles` (UNIQUE `user_id`):
- `admin` — cria e gere produtos, módulos, alunos, webhooks
- `user` — aluno; consome conteúdo comprado

Função SQL `has_role(uuid, app_role)` é `STABLE SECURITY DEFINER`: usada em RLS policies para verificar role do utilizador autenticado sem permitir bypass via `service_role`.

### 4.3 RLS policies por tabela

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | `auth.uid() = id` | trigger `handle_new_user` | `auth.uid() = id` | n/a |
| `user_roles` | `auth.uid() = user_id` | trigger `handle_new_user` | bloqueado pelo próprio user (ADR-004) | n/a |
| `products` | público se `is_active`; admin SELECT seus | `has_role('admin')` | admin owner | admin owner |
| `modules` | aluno via compra OU `is_preview`; admin via `products.admin_id` | admin owner | admin owner | admin owner |
| `purchases` | aluno próprio; admin do produto | apenas Edge Function `webhook-payment` (service role) | apenas Edge Functions | bloqueado em v1.0 |
| `user_progress` | próprio user; admin do produto (FDD-005 policy `admins_read_product_progress`) | próprio user | próprio user (com trigger de monotonicidade) | próprio user |
| `certificates` | próprio user; admin do produto | apenas Edge Function `generate-certificate` | apenas Edge Function | bloqueado |
| `notifications` | próprio user | apenas Edge Function `send-notification` | próprio user (mark as read) | próprio user |
| `webhook_logs` | apenas service role; admin do produto via FDD-002 policy | apenas Edge Function | bloqueado | TTL 30 d via cron job |
| `admin_invites` | apenas service role | Edge Function `admin-invite` | Edge Function (consume) | bloqueado em v1.0 |
| `system_config` | público (key configurada) | apenas service role | apenas service role | bloqueado |

### 4.4 Auditoria de policies

- **Periodicidade:** auditoria formal por release (deploy major); responsável: autor do release.
- **Auditoria ad-hoc:** sempre que nova tabela com dados de utilizador for adicionada.
- **Checklist em PR template** (`.github/PULL_REQUEST_TEMPLATE.md`, a criar):
  1. RLS activada em qualquer tabela nova adicionada
  2. Policies cobrem SELECT, INSERT, UPDATE, DELETE (ou justificação documentada para subset)
  3. RLS testada manualmente com 2 contas de utilizadores diferentes
  4. Zero uso de `service_role` em código frontend
  5. Policies auditadas explicitamente pelo reviewer no PR review
- **Testes automatizados de isolamento multi-tenant:** alvo após PR de Sentry mergeado. Cobertura mínima: 3 cenários por tabela (leitura cruzada, escrita cruzada, delete cruzado).

---

## 5. Multi-tenant isolation

### 5.1 Modelo

ADR-002: cada admin é um tenant; sem tabela `organizations`. Ownership por cadeia de FK:

```
profiles (admin)
   ↓ owns
products (admin_id)
   ↓ has many
modules (product_id) ← user_progress (module_id, user_id)
   ↑ has many
purchases (product_id, user_id)
   ↑ derives
certificates (product_id, user_id)
```

### 5.2 Isolamento garantido por

- **RLS policies** (§4.3) que comparam `auth.uid()` com colunas de ownership
- **JOIN policies** quando ownership é indirecto (ex: `admins_read_product_progress` em `user_progress` faz JOIN em `modules` e `products` para confirmar `admin_id = auth.uid()`)
- **Sem coluna `organization_id`** simplifica policies e elimina ambiguidade

### 5.3 Cenários de teste obrigatórios

Para cada tabela com `user_id` ou ownership por admin, três cenários manuais:

1. **Leitura cruzada bloqueada:** aluno A não vê dados do aluno B; admin A não vê dados do admin B
2. **Escrita cruzada bloqueada:** aluno A não escreve em linhas do aluno B; admin A não modifica produtos do admin B
3. **Delete cruzado bloqueado:** aluno A não apaga linhas do aluno B; admin A não apaga dados do admin B

Critério: testes manuais documentados em runbook são aceites em v1.0; suite automatizada é alvo após PR de Sentry mergeado.

---

## 6. Privilege escalation prevention

### 6.1 Modelo de promoção

ADR-004 e FDD-001 definem o pacto:

- **`promote_to_admin(target_user_id) SECURITY DEFINER`:** função SQL valida `has_role(auth.uid(), 'admin')` antes de fazer UPDATE em `user_roles`. Apenas um admin existente pode promover outro.
- **Edge Function `promote-admin`:** cobre exclusivamente o signup inicial (primeiro admin da plataforma) usando bootstrap token configurado em env var.
- **Política RLS em `user_roles`:** bloqueia UPDATE pelo próprio utilizador, mesmo se SDK fizer chamada directa.

### 6.2 Bootstrap token: ciclo de vida

| Estado | Descrição |
|---|---|
| Inicial | Token gerado e configurado em `ADMIN_BOOTSTRAP_TOKEN` no Supabase Vault |
| Activo (zero uso) | Validado para criar primeiro admin via `promote-admin` |
| Pós-uso | **Deve ser invalidado manualmente após primeira utilização produtiva**; rotação em qualquer suspeita de vazamento |
| Em incidente | Rotação imediata + revogação da sessão criada com o token |

A rotação automática após N usos fica registada como dívida (FDD-001 marker `[NECESSITA INPUT]` resolvido em ADR ou Runbook).

### 6.3 Defesas adicionais

- **hCaptcha** em `signup` e `use_invite` (FDD-001) bloqueia bot spam que tente brute force de tokens
- **Single-use** de tokens de convite (`admin_invites.used_at` set após resgate)
- **Expiração** de convites: TTL 7 dias por default

---

## 7. Storage security

### 7.1 Buckets

| Bucket | Visibilidade | Conteúdo | TTL signed URL |
|---|---|---|---|
| `product-images` | público | Capas de produto (admin upload) | n/a |
| `module-content` | privado | PDFs anexados a módulos. **Vídeos não estão aqui** (são YouTube embeds) | 3600 s |
| `certificates` | privado | PDFs gerados pela Edge Function `generate-certificate` | 300 s |
| `avatars` | público | Foto de perfil do utilizador | n/a |
| `logos` | público | Logo do criador (display em página pública) | n/a |

### 7.2 Geração de signed URLs

- **ServiceLayer único ponto** (ADR-006 + ADR-008): páginas e hooks invocam `storageService.getSignedUrl` ou os métodos de domínio (`modules.service.getPdfSignedUrl`, `certificates.service.getDownloadUrl`).
- **Edge Function** `generate-certificate` retorna signed URL no response para download imediato (FDD-004).
- **Frontend nunca cacheia** signed URL: `staleTime: 0` em queries de URL.

### 7.3 Bucket RLS para `certificates`

FDD-004 §5.3 define três policies em `storage.objects`:

| Policy | Operação | Condição |
|---|---|---|
| `users_read_own_certificates` | SELECT | `(storage.foldername(name))[1] = auth.uid()::text` |
| `service_role_writes_certificates` | INSERT | `auth.role() = 'service_role'` |
| `admins_read_their_product_certificates` | SELECT | EXISTS em `certificates` JOIN `products` com `admin_id = auth.uid()` |

### 7.4 Vídeos (YouTube embeds) — fora deste perímetro

Vídeos não estão no Storage Supabase em v1.0; são YouTube embeds renderizados via iframe. Risco residual: aluno partilha URL do YouTube (admin recomendado configurar como "unlisted" no YouTube). Esse risco é tratado como produto, não como Storage.

---

## 8. Webhook security

### 8.1 Validação por plataforma

FDD-002 define arquitectura de validators plugin:

| Tier | Plataforma | Mecanismo |
|---|---|---|
| 1 | Stripe | `Stripe.webhooks.constructEvent` (HMAC SHA-256 em header) |
| 1 | Kiwify | HMAC SHA-256 customizado em header |
| 1 | Hotmart | HMAC SHA-256 customizado em header |
| 2 | Genérico (Monetizze, Eduzz) | `GenericValidator` com regras configuráveis |

### 8.2 Idempotência

ADR-005: `UNIQUE(external_transaction_id)` em `purchases`. Constraint deve ser aplicada via migration **antes** do primeiro webhook real (HLD próximos passos #2). Edge Function captura `23505` como duplicação benigna e retorna 200 OK.

### 8.3 Secret management

| Estado | Origem | Granularidade |
|---|---|---|
| **Actual (v1.0)** | env var global `WEBHOOK_SECRET` no Supabase | Comum a todos os admins |
| **Alvo (v1.x)** | `products.webhook_secret` per produto (coluna já existe) | Per-produto |

Migração obrigatória antes de aceitar produção real. Secret comprometido na configuração actual permite forging em **qualquer** produto de **qualquer** admin (Risco 3 do HLD).

### 8.4 webhook_logs

- **TTL 30 dias** (FDD-002): payload raw retido para forensics; remoção automática via `pg_cron` ou Edge Function agendada
- **RLS:** apenas service role escreve; admin do produto lê os seus próprios logs
- **Body raw** logado mesmo em payload inválido (mismatched signature) para debug

---

## 9. Frontend security

### 9.1 XSS prevention

- **React por default escapa** valores em JSX
- **`dangerouslySetInnerHTML` proibido** sem `dompurify` (já em deps; `dompurify@^3.3.1`)
- **HTML user-generated** (descrições de produto, módulos): sanitizado via `dompurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'], ALLOWED_ATTR: ['href', 'target', 'rel'] })`
- **Code review obrigatório** marca `dangerouslySetInnerHTML` como red flag

### 9.2 Content Security Policy (CSP)

CSP header servida pelo host de frontend (Vercel/Netlify config). Valor canónico:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://*.sentry.io https://www.youtube.com https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io;
img-src 'self' data: https://*.supabase.co https://i.ytimg.com;
frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

`'unsafe-inline'` em script-src é tolerado em v1.0 por causa do bundle Vite com inline styles; alvo v1.x: nonce-based via SSR ou hash de scripts conhecidos.

### 9.3 X-Frame-Options

Header **`X-Frame-Options: DENY`** (HLD próximos passos #9). Alternativa moderna: `frame-ancestors 'none'` em CSP (já incluído acima). Configurar ambos para compatibilidade com browsers antigos.

### 9.4 Outros headers de hardening

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — força HTTPS
- `X-Content-Type-Options: nosniff` — previne MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — limita Referer cross-origin
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — desactiva APIs não usadas

### 9.5 Service Worker boundaries

FDD-006 PWA Shell:
- **Scope:** `/` (default); SW serve toda a aplicação
- **Sub Resource Integrity (SRI):** considerado para CDN externos (Google Fonts, YouTube API). Vite PWA + Workbox geram SRI para assets locais; CDN externo fica sem SRI em v1.0
- **Cache de tokens:** Workbox **nunca cacheia** chamadas a `/auth/v1/*` nem `/storage/v1/object/sign/*` (NetworkOnly per FDD-006 §3.2)

---

## 10. Secrets management

### 10.1 Inventário de segredos

| Segredo | Localização | Acesso | Rotação |
|---|---|---|---|
| `SUPABASE_URL` | Build-time (`VITE_SUPABASE_URL`) | Frontend (público) | n/a |
| `SUPABASE_ANON_KEY` | Build-time (`VITE_SUPABASE_ANON_KEY`) | Frontend (público mas RLS protege) | em incidente |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Vault (Edge Functions) | Edge Functions exclusivamente | em incidente |
| `WEBHOOK_SECRET` (global, v1.0) | Supabase Vault | `webhook-payment` | per-incidente; migrar para per-product |
| `STRIPE_SECRET_KEY` | Supabase Vault | `webhook-payment` | per-incidente |
| `STRIPE_WEBHOOK_SECRET` | Supabase Vault | `webhook-payment` | per-incidente |
| `RESEND_API_KEY` | Supabase Vault | `send-notification`, `send-purchase-confirmation`, `admin-invite-student` | trimestral |
| `HCAPTCHA_SECRET` | Supabase Vault | `admin-invite`, `signup-validation` | em incidente |
| `ADMIN_BOOTSTRAP_TOKEN` | Supabase Vault | `promote-admin` | após primeira utilização |
| `VITE_SENTRY_DSN` | Build-time | Frontend (público; DSN não é segredo) | n/a |

### 10.2 Boundaries

- **`VITE_*` prefixed** vars são embebidas no bundle do frontend e são públicas. Só `SUPABASE_URL` e `SUPABASE_ANON_KEY` (protegida por RLS) e `SENTRY_DSN` (DSN não é segredo) podem ter este prefixo.
- **Service-role key NUNCA** em frontend. CI verifica que `SERVICE_ROLE` não aparece em diff de PR.
- **`.env*` no `.gitignore`**; `.env.example` documenta formato sem valores.

### 10.3 Plano de evolução

Alvo v1.x: secrets em Doppler ou Infisical (HLD decisão pendente). Beneficios: rotação automática, histórico, separação por ambiente. Critério de activação: > 5 ambientes (dev/stg/prod/preview/local) ou > 10 segredos para rotacionar.

---

## 11. CORS, rate limiting, captcha

### 11.1 CORS

| Edge Function | Estado actual | Estado alvo |
|---|---|---|
| `webhook-payment` | `Access-Control-Allow-Origin: *` | restringir a IPs/domínios das plataformas (ou manter `*` se sender envia preflight; OPTIONS sempre 200) |
| `generate-certificate`, `process-payment`, `send-notification`, etc. | `*` | env var `APP_DOMAIN` (ex: `https://app.appxpro.com`) |
| `admin-invite-student`, `admin-invite`, `promote-admin`, `reset-user-password` | `*` | `APP_DOMAIN` estrito |

Migração obrigatória antes do go-live (HLD próximos passos #8).

### 11.2 Rate limiting

| Recurso | Limite | Implementação |
|---|---|---|
| Supabase Auth (login, signup, recovery) | 5 tentativas / 60 s / IP | Nativo Supabase |
| Edge Functions globais | Limite do plano (Pro: 500 req/s) | Nativo Supabase |
| `webhook-payment` por IP | Per FDD-002: rate limit configurável; estado actual sem limite custom | Custom em Edge Function |
| `admin-invite` | Por admin: 50 convites / dia | Validação aplicacional + log |
| `signup` | Globalmente protegido por hCaptcha | hCaptcha v1 |

### 11.3 Captcha

**hCaptcha** em dois pontos críticos (FDD-001):

- **`signup` (admin self-registration)**: bloqueia bot spam que tente criar admins em massa
- **`use_invite` (admin)**: bloqueia tentativas de força bruta de tokens de convite

hCaptcha key em `HCAPTCHA_SECRET` (server) e `VITE_HCAPTCHA_SITEKEY` (client; sitekey é público).

### 11.4 Rate limit em frontend

`@tanstack/react-query` com `staleTime` por domínio (FDD-003 §6.2) reduz pressão em endpoints repetidos. Não é rate limit propriamente; é cache que efectivamente reduz request rate em cenários típicos.

---

## 12. Logging e forensics

### 12.1 Correlation ID

`X-Request-Id` UUID gerado no entrypoint (frontend para chamadas a Edge Functions; webhook sender ou Edge Function para webhooks externos), propagado em todos os logs estruturados de Edge Functions e em breadcrumbs do Sentry. HLD próximos passos #10.

### 12.2 Structured logging em Edge Functions

Schema JSON mínimo:

```json
{
  "timestamp": "2026-04-29T10:15:30.123Z",
  "level": "info|warn|error",
  "request_id": "uuid",
  "function": "webhook-payment",
  "event": "validator.signature_valid|insert.success|notification.failed",
  "user_id": "uuid|null",
  "product_id": "uuid|null",
  "duration_ms": 123,
  "metadata": { ... }
}
```

Implementação: helper `logger.ts` partilhado por todas as Edge Functions; substitui `console.log` text plain (estado actual).

### 12.3 Sentry no frontend

ADR-009 (gaps preenchidos):
- `tracesSampleRate: 0.1` (10% performance tracing)
- `sendDefaultPii: false`
- `beforeSend` aplica scrubbing de campos `email`, `full_name`, `cpf`, `cnpj`, `password`, tokens e signed URLs em qualquer evento ou breadcrumb
- Breadcrumbs: route changes do React Router (default); chamadas fetch (default); **não** queries TanStack
- Sentry SDK inicializado em `src/main.tsx` antes do `<App />` para garantir cobertura desde o boot

### 12.4 Retenção de logs

| Recurso | Retenção | Ferramenta |
|---|---|---|
| `webhook_logs` (payload raw) | 30 dias | TTL via coluna gerada + `pg_cron` ou Edge Function agendada |
| Logs Supabase Edge Functions | 7 dias (Free) / 14-30 dias (Pro) | Nativo Supabase |
| Sentry events | 30 dias (plano básico) / 90 dias (plano superior) | Nativo Sentry |
| Logs de auth (Supabase Auth) | 7 dias (Free) / 14 dias (Pro) | Nativo Supabase |

### 12.5 PII em logs

- **Frontend (Sentry):** scrubbing por campo (§12.3)
- **Edge Functions:** evitar logar `email`, `full_name`, `cpf` directamente; usar `user_id` (UUID, não-PII) como referência
- **`webhook_logs`:** payload raw inclui PII (nome do comprador, e-mail, valor); aceite em troca de capacidade forense; mitigado pelo TTL 30 d e RLS por admin do produto

---

## 13. Compliance LGPD

### 13.1 Dados pessoais armazenados

| Dado | Tabela / Storage | Categoria | Base legal |
|---|---|---|---|
| Nome completo | `profiles.full_name`, `certificates` (PDF) | PII directo | Execução de contrato |
| E-mail | `profiles.email`, `auth.users` | PII directo | Execução de contrato |
| Avatar | `profiles.avatar_url`, bucket `avatars` | PII potencial (foto) | Consentimento (upload opcional) |
| Histórico de compra | `purchases` | Comportamental | Execução de contrato |
| Progresso de aprendizagem | `user_progress` | Comportamental | Execução de contrato |
| `external_transaction_id` | `purchases` | Identificador transacional | Execução de contrato |
| IP, user-agent | Logs Supabase, `webhook_logs` | Técnico | Interesse legítimo (segurança) |

### 13.2 Retenção

| Dado | Política em v1.0 |
|---|---|
| `profiles` activos | Indefinida enquanto a conta existe |
| `profiles` apagados | ON DELETE CASCADE remove dependências (purchases, progress, certificates); `auth.users` row removida |
| `purchases` canceladas/refundadas | Retenção indefinida em v1.0 (decisão pendente per HLD; provavelmente 5-7 anos por requisitos contábeis) |
| `webhook_logs` | 30 dias (TTL automático) |
| Logs de auth | Conforme plano Supabase (§12.4) |

### 13.3 Direitos do titular

| Direito | Implementação v1.0 | Alvo v1.x |
|---|---|---|
| Acesso | Aluno consulta os próprios dados via `/student` | Manter |
| Rectificação | Edição de profile via `/student/profile` | Manter |
| Exclusão | Apenas via support (e-mail manual + delete via `auth.admin`) | Auto-serve em `/student/profile` |
| Portabilidade | Não implementado em v1.0 | Export JSON via Edge Function |
| Oposição | Não aplicável a base legal "execução de contrato" | n/a |

### 13.4 Sub-processadores

| Sub-processador | Localização | Dados tratados | Termo |
|---|---|---|---|
| Supabase | US (AWS) | Auth, DB, Storage, Edge Functions | DPA Supabase |
| Resend | US | E-mails transacionais | DPA Resend |
| YouTube | US (Google) | Apenas URL embed; YouTube vê IP do aluno e cookie YouTube | DPA Google |
| Sentry | US/UE (selecionável) | Errors do frontend; PII filtrada | DPA Sentry |
| Hotmart, Kiwify, Monetizze, Eduzz, Stripe | Variado | Dados de compra (PII) | DPA específico por integrador |

### 13.5 DPO e DPIA

- **DPO:** não nomeado em v1.0. LGPD obriga DPO apenas para tratamento em larga escala. Reavaliar quando MAU > 5000.
- **DPIA:** não realizada em v1.0. Reavaliar antes de processamento de dados sensíveis (saúde, racial, etc.; nenhum em v1.0).

### 13.6 Avisos

Documento define práticas técnicas. Texto legal vivo em **Política de Privacidade pública** (fora do âmbito SDD; produto entrega como página `/privacidade` antes de go-live).

---

## 14. Incident response

### 14.1 Princípios

- **Detecção primeiro:** Sentry alerta + métricas Supabase + logs estruturados (§12)
- **Contenção rápida:** revogar acesso comprometido em minutos
- **Comunicação transparente:** notificar afectados em ≤ 72 h conforme Art. 48 LGPD
- **Post-mortem obrigatório** dentro de 5 dias úteis para incidentes críticos

### 14.2 Cenários

#### IR-1: Service-role key vazada

- **Detecção:** alerta de regex em GitGuardian ou similar; chamada inesperada com role `service_role` em logs Supabase.
- **Contenção:** rotacionar `SUPABASE_SERVICE_ROLE_KEY` no Supabase Vault; redeploy de todas as Edge Functions; invalidar tokens activos via Supabase.
- **Remediação:** auditar logs de auth nas últimas 24 h; identificar criação ou modificação suspeita de dados; reverter mutações via backup se necessário.
- **Comunicação:** se houve acesso a dados de utilizador, notificar afectados em 72 h.
- **Post-mortem:** revisar como a key vazou; reforçar controlos.

#### IR-2: Cross-tenant data leak via RLS gap

- **Detecção:** report de utilizador, logs de queries com `bypass` de policy (Sentry), ou auditoria de release.
- **Contenção:** desactivar imediatamente a feature/route afectada (via toggle ou rollback do PR); auditar policy específica.
- **Remediação:** corrigir policy; re-deploy; testar com 2 contas.
- **Comunicação:** se confirmado vazamento, notificar afectados em 72 h.
- **Post-mortem:** acrescentar caso ao checklist de PR template; cobrir em testes automatizados.

#### IR-3: Webhook secret comprometido

- **Detecção:** webhook com assinatura válida mas payload anómalo (valor estranho, produto inexistente); volume súbito de compras de uma plataforma.
- **Contenção:** rotacionar `WEBHOOK_SECRET` (ou `products.webhook_secret` do produto afectado em alvo); invalidar `purchases` criadas no janela suspeita (set `status='cancelled'`).
- **Remediação:** reconciliar com plataforma de pagamento (Hotmart/Kiwify/etc.); emitir refunds para compras forjadas confirmadas.
- **Comunicação:** notificar admin afectado e alunos cujo acesso foi indevidamente concedido.
- **Post-mortem:** acelerar migração para per-product secret (HLD Risco 3).

#### IR-4: Privilege escalation em `user_roles`

- **Detecção:** linha em `user_roles` com `role='admin'` cujo `created_at` não corresponde a chamada legítima a `promote_to_admin`; aluno reporta acesso a `/admin/*`.
- **Contenção:** UPDATE manual revertendo `user_roles.role` para `'user'`; revogar sessões activas do utilizador suspeito.
- **Remediação:** auditar todas as linhas de `user_roles` criadas/modificadas no janela suspeita; verificar se `promote_to_admin` SECURITY DEFINER está activo e RLS de UPDATE bloqueada.
- **Comunicação:** notificar admins legítimos cujo produto foi acedido pelo escalado.
- **Post-mortem:** reforçar testes de isolamento; auditar policy de UPDATE em `user_roles`.

#### IR-5: Vazamento de URL de Storage privado (PDF)

- **Detecção:** report de utilizador; volume súbito de downloads do mesmo path por IPs diferentes.
- **Contenção:** mover ficheiro de `<bucket>/<path>` para `<bucket>/quarantine/<timestamp>-<path>`; isto invalida URLs activas instantaneamente.
- **Remediação:** reupload do ficheiro com novo path; actualizar referência em `modules.pdf_url` ou `certificates.pdf_url`.
- **Comunicação:** e-mail Resend ao utilizador afectado explicando situação; oferecer apoio.
- **Post-mortem:** revisar TTL (300 s para certificados; já no limite); avaliar se foi partilha intencional ou vazamento técnico.

#### IR-6: Webhook payload duplicado em produção

- **Detecção:** plataforma reenvia webhook após resposta lenta; alunos reportam acesso duplicado ou e-mail duplicado.
- **Contenção:** verificar constraint `UNIQUE(external_transaction_id)` está activa (deve estar antes de go-live per HLD).
- **Remediação:** se duplicação ocorreu pré-constraint, identificar via SQL `GROUP BY external_transaction_id HAVING COUNT(*) > 1` e remover linhas excedentes.
- **Comunicação:** ao admin do produto afectado.
- **Post-mortem:** garantir que constraint é aplicada antes de novos webhooks chegarem.

#### IR-7: Delete acidental em produção (sem soft-delete em v1.0)

- **Detecção:** report de admin que apagou produto/módulo por engano; confirmação em logs Supabase.
- **Contenção:** parar quaisquer escritas relacionadas; bloquear acesso de admin afectado temporariamente se acção for repetida.
- **Remediação:** restore via backup automático Supabase (RTO: horas a 1 dia); fluxo via dashboard Supabase.
- **Comunicação:** admin recebe estimativa de RTO; alunos do produto afectado recebem aviso de indisponibilidade.
- **Post-mortem:** acelerar implementação de soft-delete via `deleted_at` (HLD Risco 10).

### 14.3 Comandos exactos

Comandos shell, queries SQL e procedimentos passo-a-passo vivem nos **Runbooks** (próximo deliverable). O SDD define **o quê** acontece em incidente; os Runbooks definem **como** executar cada passo.

---

## 15. Estado actual vs alvo (matriz de pendências)

| Item | Estado | Prioridade | Dependência | Owner |
|---|---|---|---|---|
| Privilege escalation: `promote_to_admin SECURITY DEFINER` | ❌ Não implementado | Crítica (bloqueador go-live) | FDD-001 PR | Backend |
| `UNIQUE(external_transaction_id)` migration | ❌ Não aplicado | Crítica (bloqueador go-live) | Migration SQL | Backend |
| Webhook secret per-product | ❌ Estado actual: global | Alta | Migration + FDD-002 PR | Backend |
| Bucket `certificates` + RLS policies | ❌ Não criado | Crítica (FDD-004 depende) | FDD-004 PR 1 | DevOps |
| RLS `admins_read_product_progress` | ❌ Não criado | Alta (FDD-005 PR 6 depende) | FDD-005 PR 1 | Backend |
| ServiceLayer (eliminar acesso directo a Supabase) | ⏳ Em curso | Alta | FDD-003 PRs 0-6 | Frontend |
| CORS Edge Functions: `APP_DOMAIN` | ❌ `*` em todas | Alta | Refactor + env var | Backend |
| `X-Frame-Options: DENY` + CSP | ❌ Não configurado | Média | Config Vercel/Netlify | DevOps |
| Logs estruturados + `X-Request-Id` | ❌ Logs text plain actuais | Média | Helper `logger.ts` | Backend |
| Sentry SDK frontend | ❌ Não instalado | Média | `npm install` + init | Frontend |
| Suite de testes de isolamento multi-tenant | ❌ Não criada | Média | Após Sentry mergeado | Backend |
| Suite de fixtures de webhook por plataforma | ❌ Não criada | Média | FDD-002 | Backend |
| `dompurify` em todas as descrições user-generated | ⚠️ A validar (já em deps; uso a confirmar) | Alta | Auditoria de páginas | Frontend |
| Password policy (HIBP, comprimento) | ⚠️ Default Supabase | Média | Configuração Dashboard | DevOps |
| 2FA para admin | ❌ Fora de v1.0 | Baixa (alvo v1.x) | Supabase Auth MFA | Frontend |
| Plano Supabase Pro contratado | ❌ Não confirmado | Crítica (bloqueador go-live; `generate-certificate` inviável em Free) | Compra | Negócio |
| Política de Privacidade pública | ❌ Não escrita | Crítica (bloqueador go-live) | Texto legal | Legal/Produto |
| Política de retenção de `purchases` cancelled/refunded | ❌ Não definida | Média | Decisão de negócio + ADR | Legal/Negócio |
| Soft-delete em `products` e `modules` | ❌ Não implementado | Média | Migration + refactor | Backend |
| Runbooks operacionais | ❌ Não escritos | Alta | Próximo doc após SDD | Documentação |

Legenda: ✅ feito, ⏳ em curso, ❌ não iniciado, ⚠️ parcial ou a validar.

---

## 16. Próximos passos

1. **Bloqueadores de go-live** (devem fechar antes de aceitar primeiros utilizadores reais):
   - Privilege escalation fix (FDD-001 PRs)
   - `UNIQUE(external_transaction_id)` aplicado
   - Bucket `certificates` + policies (FDD-004 PR 1)
   - Plano Supabase Pro contratado
   - Política de Privacidade pública publicada
2. **Hardening de alta prioridade** (logo após go-live):
   - Migrar para webhook secret per-product
   - CORS por `APP_DOMAIN`
   - X-Frame-Options + CSP no host de frontend
   - ServiceLayer completo (FDD-003 PR 6 mergeado; regra de no-direct-supabase enforce)
3. **Observabilidade** (paralelo aos itens 1-2):
   - Sentry SDK
   - Logs estruturados + `X-Request-Id`
4. **Testes de isolamento** (após Sentry):
   - Suite automatizada cobrindo 3 cenários por tabela
   - CI bloqueia merge se testes falhem
5. **Documentação operacional**:
   - Runbooks para 7 cenários de IR (próximo deliverable)
6. **Hardening secundário** (alvo v1.x):
   - 2FA para admin
   - Soft-delete em produtos e módulos
   - Auto-serve de exclusão LGPD
   - Doppler/Infisical para secrets

---

*SDD consolida o modelo de segurança da v1.0 a partir de ADRs, FDDs e HLD. Decisões de baixa controvérsia (CSP, X-Frame-Options, CORS) são fechadas neste documento; decisões com escopo arquitectural maior continuam a viver em ADRs próprios. A matriz de pendências (§15) é a referência canónica para o que falta antes do go-live; os Runbooks (próximo deliverable) operacionalizam os cenários de §14.*
