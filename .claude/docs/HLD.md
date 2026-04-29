### HLD: APP XPRO

Versão: 1.0
Data: 2026-04-26
Responsável: André dos Reis

---

### Objetivo técnico

Prover uma plataforma SaaS multi-tenant que entrega conteúdo digital estruturado (vídeo, PDF, texto, quiz) como Progressive Web App instalável, com acesso controlado por compras processadas automaticamente via webhooks das plataformas Hotmart, Kiwify, Monetizze e Eduzz, garantindo isolamento completo de dados entre criadores via Row Level Security no PostgreSQL.

Problemas técnicos endereçados:
- Ausência de área de membros própria; criadores dependem de plataformas externas para entrega
- Liberação manual de acesso após compra; sem automação via webhook
- Sem rastreamento de progresso do aluno no lado do criador
- Promoção de role admin executada via UPDATE direto do cliente sem validação server-side; qualquer utilizador autenticado pode escalar privilégios se a política RLS em `user_roles` tiver gap
- Lógica de negócio misturada nas páginas React (queries Supabase diretas nos componentes) sem camada de serviço isolada; dificulta testes e manutenção
- Ausência de PWA real (sem service worker funcional e manifest completo); aplicação não é instalável nem funciona offline, contradizendo a proposta de valor central

Dependências com outros sistemas
- Supabase Auth (sessão, convite, reset de senha)
- Supabase PostgreSQL (dados + RLS)
- Supabase Storage (vídeos, PDFs, imagens)
- Supabase Edge Functions (webhooks, certificados, notificações, e-mail)
- Resend (e-mail transacional disparado pelas Edge Functions)
- Webhook senders externos: Hotmart, Kiwify, Monetizze, Eduzz
- Checkout direto (Stripe, Mercado Pago, PIX) fora do escopo v1.0

---

### Arquitetura geral

Topologia em camadas: SPA React no cliente comunica via Supabase JS Client com a plataforma Supabase, que concentra Auth, PostgreSQL com RLS, Storage e Edge Functions Deno. Eventos externos (webhooks de pagamento) atingem diretamente as Edge Functions. E-mail transacional é despachado via Resend a partir das Edge Functions. Não há backend próprio; toda a lógica server-side corre em Edge Functions serverless.

```
┌─────────────────────────────────────────────┐
│           CLIENT LAYER (Browser/PWA)        │
│   React 18 + TypeScript + Vite              │
│   shadcn/ui + TanStack Query + React Router │
│   Service Worker (PWA, a implementar)       │
└──────────────────┬──────────────────────────┘
                   │ HTTPS + Supabase JS Client v2
┌──────────────────▼──────────────────────────┐
│              SUPABASE PLATFORM              │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐ │
│  │   Auth   │ │  PostgreSQL │ │ Storage  │ │
│  │ JWT/PKCE │ │  + RLS      │ │  buckets │ │
│  └──────────┘ │  multi      │ └──────────┘ │
│               │  tenant     │              │
│               └─────────────┘              │
│  ┌─────────────────────────────────────┐   │
│  │        Edge Functions (Deno)        │   │
│  │  webhook-payment                    │   │
│  │  process-payment                    │   │
│  │  generate-certificate               │   │
│  │  send-notification                  │   │
│  │  send-purchase-confirmation         │   │
│  │  admin-invite-student               │   │
│  │  promote-admin                      │   │
│  │  reset-user-password                │   │
│  └─────────────────────────────────────┘   │
└──────────┬──────────────────────┬──────────┘
           │                      │
┌──────────▼──────┐    ┌──────────▼──────────┐
│ Webhook Senders │    │       Resend         │
│ Hotmart/Kiwify  │    │  E-mail transacional │
│ Monetizze/Eduzz │    └─────────────────────┘
└─────────────────┘
```

Ambiente de implantação
- Cloud (Vercel ou Netlify para o frontend; Supabase Cloud para Auth, DB, Storage e Edge Functions; Resend Cloud para e-mail)
- Distribuição global de assets via CDN do host de frontend
- Edge Functions executam no runtime Deno do Supabase Edge

Tecnologias principais
- React 18 + TypeScript + Vite (frontend SPA)
- shadcn/ui + Radix UI primitives (componentes)
- TanStack Query v5 (estado de servidor e cache no cliente)
- React Router v6 (roteamento)
- Supabase JS Client v2 (acesso a Auth, DB, Storage, Realtime)
- Supabase PostgreSQL 15 + RLS (persistência e autorização)
- Supabase Edge Functions com Deno runtime (lógica server-side)
- Supabase Storage (binários)
- Supabase Realtime (notificações in-app)
- Resend (e-mail transacional)
- pdf-lib ou equivalente Deno-compatible (geração de PDF de certificados)

Padrões adotados
- Multi-tenant por `admin_id` (sem tabela `organizations`); isolamento via RLS
- Auth flow PKCE para sessões web
- Convite por e-mail para onboarding de alunos
- Serverless event-driven para processamento de webhooks
- Idempotência aplicacional por `external_transaction_id`
- ServiceLayer entre páginas React e Supabase JS Client (a implementar)
- ProtectedRoute por role apenas como UX (autorização real garantida por RLS)

Matriz de portabilidade (referenciada pelo Risco 1)

| Componente | Supabase-specific | Equivalente portável |
|------------|-------------------|----------------------|
| Auth | Supabase Auth | Precisaria de Auth próprio (Auth.js, Keycloak, Auth0) |
| DB + RLS | RLS é padrão PostgreSQL | Portável para qualquer PostgreSQL gerido (RDS, Cloud SQL, Neon) |
| Storage | Supabase Storage | S3-compatible (AWS S3, Cloudflare R2, MinIO) |
| Edge Functions | Deno runtime + Supabase routing | Precisaria de serverless próprio (Cloudflare Workers, Vercel Edge, AWS Lambda) |
| Realtime | Supabase Realtime | Precisaria de WebSocket próprio (Pusher, Ably, Socket.IO) |
| Admin Auth API (`auth.admin.*`) | API proprietária Supabase | Não portável diretamente; recriar com provider escolhido |
| Schema SQL | Padrão PostgreSQL | Totalmente portável |

---

### Componentes e responsabilidades

| Componente | Responsabilidades | Dependências |
|------------|-------------------|--------------|
| PWAShell (a implementar) | manifest.json completo + Service Worker via Vite PWA plugin (Workbox); habilita instalação e cache de assets estáticos | Vite PWA plugin |
| AuthProvider (`src/hooks/useAuth.tsx`) | Gestão de sessão Supabase; expor `useAuth`, `ProtectedRoute` por role | Supabase JS Client |
| ServiceLayer (a implementar, `src/services/`) | Encapsular queries Supabase em módulos por domínio (`products.service.ts`, `purchases.service.ts`, `modules.service.ts`, `progress.service.ts`, `certificates.service.ts`, `notifications.service.ts`, `auth.service.ts`); páginas e hooks consomem o service, não o cliente Supabase diretamente | Supabase JS Client, tipos gerados |
| AdminApp (`src/pages/admin/*`) | UI completa do criador (dashboard, produtos, módulos, alunos, compras, webhooks, settings) | AuthProvider, ServiceLayer, TanStack Query |
| StudentApp (`src/pages/student/*`) | UI do aluno (dashboard, player de módulo, certificado) | AuthProvider, ServiceLayer, TanStack Query |
| LandingApp (`src/pages/Index.tsx` + `src/components/landing/*`) | Página pública de marketing | Nenhuma (estática) |
| AuthFlows (`src/pages/auth/*`) | Login, signup, forgot/reset, student setup | Supabase Auth, ServiceLayer |
| NotificationCenter (`src/components/NotificationDropdown.tsx` + `useNotifications`) | Lista in-app de notificações + contador de não-lidas | Supabase Realtime, ServiceLayer |
| UI Library (`src/components/ui/*`) | Componentes base shadcn/ui reutilizados em todas as áreas | Radix UI primitives |
| Edge Function `webhook-payment` | Receber webhook das plataformas, validar assinatura, garantir idempotência por `unique(external_transaction_id)`, mapear evento para `purchases.status` | Hotmart/Kiwify/Monetizze/Eduzz, Postgres, send-purchase-confirmation, send-notification |
| Edge Function `process-payment` | Lógica interna de aprovação de compra; criar/ativar conta do aluno se não existir | Postgres, Supabase Admin Auth API |
| Edge Function `send-purchase-confirmation` | Renderizar e enviar e-mail de confirmação ao aluno | Resend |
| Edge Function `send-notification` | Criar registo em `notifications` para entrega in-app | Postgres |
| Edge Function `generate-certificate` | Gerar PDF do certificado, salvar no Storage, registar em `certificates`; re-validar elegibilidade server-side antes de gerar | Postgres, Storage, biblioteca PDF |
| Edge Function `admin-invite-student` | Criar conta do aluno e enviar link de configuração de senha | Supabase Admin Auth API, Resend |
| Edge Function `promote-admin` | Promoção inicial no signup (sem admin pré-existente para autorizar); validação por token especial | Postgres |
| Função SQL `promote_to_admin(target_user_id)` `SECURITY DEFINER` | Promoção subsequente por admin já autenticado; valida `has_role(auth.uid(), 'admin')` antes de UPDATE | `user_roles` |
| Edge Function `reset-user-password` | Reset customizado disparado pelo admin | Supabase Admin Auth API |
| Supabase Auth | Identidade, sessões, JWT/PKCE, convites, reset | Trigger `handle_new_user` cria `profiles` + `user_roles` |
| Supabase PostgreSQL + RLS | Persistência + isolamento multi-tenant | Funções SQL `has_role`, `promote_to_admin` |
| Supabase Storage Buckets | Binários (`product-images` público, `module-content` privado para PDFs de módulo, `avatars`, `logos`, `certificates` privado para PDFs de certificado). Vídeos não usam Storage; são YouTube embeds renderizados via iframe | Políticas por bucket |
| Resend API | E-mail transacional | DNS configurado para domínio remetente |
| Webhook Senders externos | Hotmart, Kiwify, Monetizze, Eduzz; notificam eventos de compra para `webhook-payment` | `webhook_secret` configurado por produto |

---

### Fluxo de requisições e de dados

**Fluxo 1: Compra aprovada (webhook end-to-end)**
- Plataforma de pagamento envia POST para `/webhook-payment?platform=<id>`
- Edge Function valida assinatura HMAC (estado atual: `WEBHOOK_SECRET` global; estado alvo: `webhook_secret` por produto)
- Verifica idempotência via SELECT em `purchases WHERE external_transaction_id = X`; se existe, retorna 200 sem ação
- Identifica produto por `external_product_id` e localiza `admin_id` dono
- Verifica/cria conta do aluno; estado alvo: `auth.admin.createUser` com `email_confirm: true` + envio manual do link de recovery via Resend (conforme implementado em `admin-invite-student`); evita o fluxo de invite tradicional que exige confirmação separada
- INSERT em `purchases` com `status='approved'`, `user_id`, `product_id`, `amount`, `transaction_id`
- Dispara em paralelo: `send-purchase-confirmation` (Resend) e `send-notification` (registo em `notifications`)
- Retorna 200 ao webhook sender

**Fluxo 2: Acesso do aluno a módulo**
- Aluno autenticado acede `/student/product/:id/module/:moduleId`
- React Router encaminha para StudentApp; chamada a `ServiceLayer.modules.findById(moduleId)`
- Supabase JS executa SELECT com JWT do aluno
- RLS valida no Postgres: `modules.is_preview = true` OU EXISTS purchase aprovada e não expirada
- Acesso permitido retorna módulo; acesso negado retorna vazio (RLS bloqueia silenciosamente)
- Vídeos são YouTube embeds: `module.video_url` armazena URL de embed do YouTube e é renderizada via `<iframe>` em `student/ModuleView.tsx`; não há signed URL nem Storage privado para vídeos. Para PDFs anexados a módulos, ServiceLayer chama `storage.createSignedUrl(module.pdf_url, expiresIn=3600)`
- Player renderiza conteúdo
- Aluno consome; progresso registado em `user_progress` (UPSERT periódico)

**Fluxo 3: Conclusão de curso e emissão de certificado**
- Aluno completa último módulo (progress >= 90%)
- ServiceLayer.progress.markComplete() executa UPSERT em `user_progress`
- Estado alvo: trigger SQL após UPDATE em `user_progress` verifica completude do curso e dispara `generate-certificate` via pg_net
- Estado v1.0 aceitável: frontend chama `generate-certificate` diretamente; Edge Function re-valida elegibilidade server-side antes de gerar (cálculo de completude a partir de `user_progress`; rejeita se < 90%)
- Edge Function verifica idempotência via `UNIQUE(user_id, product_id)` em `certificates`
- Gera número único `CERT-YYYY-XXXXXX`, renderiza PDF, faz upload para bucket privado `certificates`, INSERT em `certificates`
- Dispara `send-notification` ("Certificado disponível")
- Frontend exibe link de download via signed URL com TTL 300 s

**Fluxo 4: Onboarding do aluno (convite)**
- Admin clica "Convidar Aluno" no painel
- AdminApp invoca `admin-invite-student` Edge Function
- Edge Function verifica se e-mail já existe em `auth.users`; se sim gera link de recovery, se não cria utilizador via `auth.admin.createUser` com `email_confirm: true`
- Garante `user_roles.role = 'user'` (UPDATE ou INSERT)
- Se `product_id` fornecido, INSERT em `purchases` com `status='approved'` e sem `transaction_id` (cobre liberação manual)
- Resend envia e-mail com link `/auth/student-setup?token=<recovery_token>`
- Aluno clica, define senha e é redirecionado para `/student`

**Fluxo de dados**
- Webhook externo recebido por Edge Function; payload validado, transformado em `purchase` no Postgres; e-mail e notificação derivados
- Mutações do aluno (progresso, leitura de notificação) escritas via Supabase JS com RLS aplicada
- Conteúdo binário sobe diretamente para Storage via Supabase JS; URL armazenada em `modules` ou `products`; entrega ao aluno via signed URL com TTL
- PDFs de certificado gerados na Edge Function, persistidos em bucket privado, referenciados em `certificates`

---

### Modelo de dados (alto nível)

Entidades principais
- `profiles` (dados pessoais; PK = `auth.users.id`)
- `user_roles` (role na plataforma, `admin` ou `user`; UNIQUE `user_id`)
- `products` (curso/produto; PK uuid; ownership por `admin_id`)
- `modules` (conteúdo; PK uuid; FK `product_id`; tipos `video`, `pdf`, `text`, `quiz`)
- `purchases` (compra; PK uuid; UNIQUE `(user_id, product_id)`; UNIQUE `external_transaction_id`)
- `user_progress` (progresso; UNIQUE `(user_id, module_id)`)
- `certificates` (certificado emitido; UNIQUE `(user_id, product_id)`)
- `notifications` (notificação in-app)

Relações
- `profiles (1) < user_roles (1)`: role do utilizador
- `profiles (1, admin) < products (N)`: admin é dono dos produtos
- `products (1) < modules (N)`: módulos pertencem ao produto
- `profiles (1, aluno) < purchases (N)`: aluno tem várias compras
- `products (1) < purchases (N)`: produto tem vários compradores
- `modules (1) < user_progress (N)`: progresso por módulo por aluno
- `products (1) < certificates (N)`: certificado por aluno por produto
- `profiles (1) < notifications (N)`

Ciclo de vida de uma compra: `pending → approved → (cancelled | refunded)`; `expires_at NULL` significa acesso perpétuo.

Constraints críticos
- `purchases.external_transaction_id` UNIQUE isolada garante idempotência aplicacional do webhook
- `purchases UNIQUE(user_id, product_id)` garante uma compra por aluno por produto

Dívidas técnicas registadas
- Renovação de acesso impedida pela constraint `UNIQUE(user_id, product_id)`; solução futura é relaxar para `UNIQUE(user_id, product_id, external_transaction_id)` ou soft-delete por linha
- Tipo `quiz` declarado no enum mas não funcionalmente implementado; entidade `quiz_questions` necessária para implementação real
- Versionamento de schema: v1.0 usa script único `EXECUTAR_NO_SUPABASE.sql`; alvo é migrar para `supabase/migrations/` versionado
- Soft delete ausente; substituído por `is_active = false` em `products`

Entidades fora de escopo v1.0 (registadas para futuro): `coupons`, `quiz_questions`, `quiz_answers`, `admin_settings`.

Fonte de verdade
- Identidade do utilizador: `auth.users` (Supabase Auth); `profiles.id` é cópia
- Role: `user_roles` é fonte de verdade; cliente não deve assumir role do JWT sem validar
- Status de compra: `purchases.status`; escrita exclusiva pelas Edge Functions de webhook
- Progresso: `user_progress`; escrita pelo próprio utilizador via RLS
- Conteúdo binário: Supabase Storage; referência via URL no banco

---

### Interfaces públicas

| Nome | Tipo | Protocolo | Exposição | SLAs/Limites |
|------|------|-----------|-----------|--------------|
| Supabase REST (PostgREST) | API | REST sobre HTTPS/JSON | Externa autenticada via JWT | p95 < 300 ms |
| Supabase Auth API | API | REST sobre HTTPS | Externa | Login p95 < 500 ms; rate limit nativo |
| Supabase Realtime | Stream | WebSocket | Externa autenticada | Propagação < 1 s |
| Supabase Storage API | API | REST sobre HTTPS | Externa | Upload máx 500 MB por arquivo |
| `webhook-payment` | API | HTTP POST + HMAC | Externa pública | Free pode exceder 3 s; Pro < 3 s |
| `generate-certificate` | API | HTTP POST + JWT | Externa autenticada | Free inviável (CPU + tempo); Pro < 8 s |
| `admin-invite-student` | API | HTTP POST + JWT (admin) | Externa autenticada | < 3 s |
| `reset-user-password` | API | HTTP POST + JWT (admin) | Externa autenticada | < 2 s |
| `promote-admin` | API | HTTP POST + token especial | Externa restrita ao signup inicial | < 1 s |
| RPC SQL `promote_to_admin(uuid)` | RPC | PostgREST `/rpc/` | Externa autenticada | < 100 ms |
| Webhook senders externos | API entrante | HTTP POST | Externa consumida | Hotmart/Kiwify aplicam retry exponencial em não-2xx |
| `process-payment` | API | HTTP POST + JWT | Interna (chamada por outras Edge Functions) | < 2 s |
| `send-purchase-confirmation` | API | HTTP POST + JWT | Interna | < 5 s (depende do Resend) |
| `send-notification` | API | HTTP POST + JWT | Interna | < 1 s |
| `auth.admin.*` (createUser, inviteUserByEmail, generateLink) | API | HTTPS + Service Role Key | Interna consumida pelas Edge Functions | Apenas server-side; chave nunca exposta no cliente |
| `storage.createSignedUrl(path, expiresIn)` | API | HTTPS + JWT | Interna consumida pelo ServiceLayer | TTL 3600 s para vídeos; TTL 300 s para certificados |
| RPC SQL `has_role(uuid, text)` | Função SQL | Chamada interna em RLS policies | Apenas uso interno em policies | < 10 ms |
| Resend API | API saída | HTTPS REST | Externa consumida | SLA 99.9% conforme contrato Resend |

Política de versionamento: Edge Functions sem prefixo `/v1/` em v1.0. Breaking change em interface pública cria nova função com sufixo `-v2`; manter original até todas as plataformas migrarem. Interfaces internas nunca versionadas.

Limites por design
- Payload de Edge Function: 6 MB
- Tempo máximo de execução: 60 s (Free) / 400 s (Pro)
- CPU time: 50 ms (Free) / 2 s (Pro); incompatível com `generate-certificate` no Free

---

### Considerações de escalabilidade e disponibilidade

Abordagem geral
- Stack inteiramente serverless e managed; escala horizontal automática via providers (CDN no frontend, auto-scale do Edge runtime no backend)
- Sem sharding de banco em v1.0; vertical scaling do plano Supabase conforme carga
- Idempotência aplicacional + retry das plataformas de pagamento garantem at-least-once para webhooks

Técnicas aplicadas
- CDN global para assets estáticos (Vercel/Netlify Edge)
- Auto-scale do Deno Deploy runtime nas Edge Functions
- TanStack Query como cache de servidor no cliente: `staleTime` por domínio (produtos 5 min, módulos 30 min, progresso fresh)
- Service Worker (a implementar) com Workbox para cache de assets estáticos; cache-first para JS/CSS, network-first para chamadas Supabase
- Storage signed URLs com cache em memória durante a sessão (TTL 3600 s)
- Índice `purchases(product_id, status)` para evitar full scan em lançamentos com hot keys; threshold de 500 webhooks simultâneos para introduzir buffer assíncrono (`webhook_queue` + worker)
- Rate limit nativo do Supabase Auth (5 tentativas em 60 s por IP) e das Edge Functions (limite global do plano)
- Sem cache offline de conteúdo de módulos em v1.0; vídeos e PDFs são grandes demais para Service Worker sem gestão explícita de quota; PWA serve para instalabilidade e experiência app-like, não uso genuinamente offline

Meta de disponibilidade
- Plataforma como um todo: 99.5% mensal
- Justificação: dependência total do SLA Supabase (99.9%); a combinação Supabase + Resend + CDN em cadeia introduz janelas de falha independentes; reivindicar 99.9% sem SLA próprio contratual seria enganoso
- Webhooks: at-least-once com idempotência; sem garantia de tempo máximo de processamento end-to-end (depende de retry das plataformas)
- Latência crítica: FCP da SPA < 2 s em 4G; liberação de acesso pós-compra (webhook recebido para `purchases.approved`) < 30 s

Recuperação de falhas
- `generate-certificate`: retry pelo cliente; idempotência por `UNIQUE(user_id, product_id)` em `certificates`
- `send-purchase-confirmation`: purchase fica `approved` mas e-mail não enviado; log estruturado com `purchase_id` + `user_email` permite reenvio manual; alvo é job periódico que detecta purchases aprovadas sem e-mail nas últimas 24 h
- Webhook: retorna 5xx; plataforma re-envia; idempotência por `external_transaction_id`
- DB: failover automático gerido pelo Supabase

---

### Segurança

Autenticação
- Provider único Supabase Auth
- Métodos: e-mail + senha; sem social login em v1.0
- Flow PKCE para sessões web
- Token JWT HS256 armazenado em `localStorage`; refresh automático pelo SDK
- ⚠️ `localStorage` é vulnerável a XSS. Mitigação ativa: React escapa por padrão; Content Security Policy a implementar no host CDN. Alternativa `httpOnly` cookie não disponível no fluxo PKCE do Supabase JS v2; é uma limitação do SDK, não uma escolha
- Expiração de sessão 30 dias
- Reset de senha via token de e-mail com TTL curto
- Convite de aluno via link `/auth/student-setup?token=<recovery>`

Autorização
- Backend: Row Level Security em todas as tabelas com dados de utilizador; uso de `auth.uid()` e `has_role(uid, role)` nas policies
- Frontend: `ProtectedRoute` por role apenas como UX; não é controle de segurança
- Edge Functions: JWT validado + verificação de role quando aplicável; `webhook-payment` valida HMAC em vez de JWT
- Promoção de role: função SQL `promote_to_admin` `SECURITY DEFINER` (admin existente) + Edge Function `promote-admin` (signup inicial); substitui o UPDATE client-side atual

Proteção de dados
- Criptografia em trânsito: TLS 1.2+ obrigatório em todas as comunicações
- Criptografia em repouso: AES-256 gerido pelo Supabase em DB e Storage
- Senhas: bcrypt gerido pelo Supabase Auth
- Bucket `certificates` configurado como privado; acesso via `createSignedUrl` com TTL 300 s (5 minutos; suficiente para download, curto para não partilhar)
- Bucket `module-content` privado com signed URLs TTL 3600 s para PDFs de módulo (vídeos são YouTube embeds; fora deste mecanismo)
- Política de PII: e-mail, nome completo e avatar armazenados em texto puro pelo necessário ao serviço; logs alvo aplicam hash SHA-256 + salt em identificadores
- LGPD não tratada formalmente em v1.0; mínimo registado é dados pessoais apenas pelo necessário e eliminação de conta via suporte (manual); tratar formalmente antes de ultrapassar 1000 utilizadores ou qualquer publicidade ativa
- Política de retenção indefinida em v1.0; sem purga automática

Gestão de segredos
- Supabase Anon Key: `.env` + bundle do cliente (público; protegido por RLS)
- Supabase Service Role Key: apenas em runtime de Edge Functions; nunca no cliente
- Webhook secrets: estado atual `WEBHOOK_SECRET` global em env do Edge; estado alvo `products.webhook_secret` por produto
- Resend API Key: apenas em runtime de Edge Functions
- Política: segredos nunca commitados; `.env.example` documenta nomes sem valores; rotação manual em incidente
- 2FA não implementado em v1.0; ativar quando qualquer admin gerir mais de 500 alunos

Hardening adicional
- CSP a definir no host (Vercel/Netlify config)
- HSTS habilitado por padrão em Vercel/Netlify
- CORS restritivo nas Edge Functions: dívida técnica de prioridade alta (estado atual `*`); restringir ao domínio de produção antes do primeiro utilizador real
- `X-Frame-Options: DENY` ou `Content-Security-Policy: frame-ancestors 'none'` no host CDN para mitigar clickjacking
- CSRF mitigado estruturalmente: autenticação usa `Authorization: Bearer <JWT>`, não cookie de sessão; não requer token CSRF adicional

---

### Observabilidade

Logs
- Estado atual: `console.log` não-estruturado disperso nas Edge Functions
- Estado alvo: JSON estruturado com `timestamp`, `level`, `function_name`, `request_id`, `user_id` (hash), `event`, `error`
- Política: nunca logar `webhook_secret`, JWT completo ou Service Role Key; hashear identificadores PII
- `X-Request-Id` UUID gerado no entrypoint e propagado em chamadas internas

Métricas
- Latência de Edge Function (p50, p95, p99) por função
- Taxa de erro de Edge Function (5xx / total) com alvo < 1%
- Throughput de webhooks por plataforma
- Latência de query Postgres (p95) com alvo < 300 ms
- Conexões DB ativas com alerta a 80% do pool
- Storage usage por bucket com alerta a 80% do limite do plano
- Tempo médio webhook → acesso liberado com alvo < 30 s
- Taxa de conversão webhook → purchase com alvo >= 99%
- Taxa de entrega de e-mail (Resend) com alvo >= 99%
- Métricas de produto: taxa de conclusão de curso (módulos concluídos / total por aluno ativo, semanal); módulos com maior abandono (progress entre 10 e 80% sem `completed = true`, mensal)

Tracing
- v1.0: correlação manual via `X-Request-Id` propagado entre Edge Functions
- OpenTelemetry como fase futura; ativar quando tempo médio de diagnóstico de incidente ultrapassar 30 minutos
- Backend de tracing pendente de decisão (Honeycomb, Tempo, Jaeger)

Dashboards e alertas
- Dashboard de saúde da plataforma: Supabase Dashboard nativo (latência e erro de cada Edge Function, conexões DB, storage usage)
- Alertas v1.0: Edge Function 5xx > 5% em 10 min; DB storage > 80%; CPU/timeout limit atingido
- Alerta de webhook não processado: fase futura. Workaround v1.0 documentado no runbook operacional via query manual `SELECT count(*) FROM purchases WHERE status = 'pending' AND created_at < now() - interval '10 minutes'`
- Sentry no frontend em v1.0 com `Sentry.init()` + captura de erros não tratados + `user.id` como contexto

SLOs
- Disponibilidade da plataforma: 99.5% mensal
- Latência de liberação de acesso: < 30 s p95 diária
- Taxa de sucesso de webhook: >= 99% diária
- Taxa de entrega de e-mail: >= 99% diária
- FCP da SPA: < 2 s p75 em 4G contínua

---

### Riscos arquiteturais e mitigação

#### Risco 1: Dependência total do Supabase como provider único
- **Probabilidade:** baixa
- **Impacto:** alto; outage do Supabase derruba toda a plataforma; migrar em incidente é inviável em horas
- **Mitigação:**
  - Manter schema SQL puro (sem features proprietárias além de RLS) para portabilidade
  - Documentar matriz de portabilidade no HLD (presente na seção Arquitetura geral)
  - Backup automatizado semanal exportado fora do Supabase (alvo)
- **Plano de contingência:** comunicação clara aos utilizadores; aguardar restauração; sem failover ativo possível em v1.0

#### Risco 2: Privilege escalation via UPDATE client-side em `user_roles`
- **Probabilidade:** alta (vulnerabilidade existe hoje no código em produção)
- **Impacto:** crítico; bloqueador de go-live
- **Mitigação:**
  - Implementar função SQL `promote_to_admin` `SECURITY DEFINER` validando `has_role(auth.uid(), 'admin')`
  - Edge Function `promote-admin` apenas para signup inicial com token especial
  - Remover UPDATE direto em `user_roles` do frontend
  - Política RLS em `user_roles` bloqueando UPDATE pelo próprio utilizador
- **Plano de contingência:** auditoria periódica de `user_roles.role = 'admin'`; alerta se quantidade de admins crescer mais de 10% num dia

#### Risco 3: Webhook spoofing por `WEBHOOK_SECRET` global
- **Probabilidade:** baixa-média
- **Impacto:** alto; atacante pode forjar `purchases` aprovadas e ganhar acesso gratuito a qualquer produto
- **Mitigação:**
  - Migrar para `products.webhook_secret` por produto (campo já existe)
  - Cada admin gera secret único na criação do produto
  - Rotação de secret ao trocar de plataforma de pagamento
- **Plano de contingência:** invalidar todos os secrets em incidente; reconciliar `purchases` com plataformas de pagamento

#### Risco 4: Cross-tenant data leak por RLS mal configurada
- **Probabilidade:** média (sem testes automatizados)
- **Impacto:** crítico; vazamento entre criadores destrói confiança e tem implicação LGPD
- **Mitigação:**
  - Testes automatizados de isolamento multi-tenant em cada nova feature
  - Code review obrigatório com checklist RLS antes de merge em `main`
  - Auditoria periódica de policies RLS por tabela
- **Plano de contingência:** notificação aos afetados dentro de 72 h conforme Art. 48 LGPD (registar no runbook operacional); revogação imediata da query/feature problemática

#### Risco 5: Geração de certificado inviável no plano Supabase Free
- **Probabilidade:** alta; CPU limit de 50 ms é incompatível com geração de PDF + upload Storage
- **Impacto:** alto; feature crítica do produto não funciona em produção sem upgrade de plano
- **Mitigação:**
  - Validar plano Pro do Supabase antes de habilitar emissão de certificados em produção
  - Testes de carga reais em staging com plano equivalente
  - Alternativa: gerar PDF assincronamente via worker externo se Supabase Pro continuar insuficiente
- **Plano de contingência:** desabilitar feature de certificados temporariamente; emitir manualmente se necessário

#### Risco 6: PWA prometido mas não implementado funcionalmente
- **Probabilidade:** alta (estado atual confirmado)
- **Impacto comercial:** alto; proposta de valor inclui "PWA profissional"; vender o que não existe gera atrito
- **Impacto técnico:** baixo; plataforma funciona sem PWA; o que falha é a promessa, não a funcionalidade core
- **Mitigação:**
  - Implementar Vite PWA plugin com Workbox antes do primeiro utilizador real
  - Validar instalabilidade em Android e iOS com Lighthouse PWA score >= 90
  - Incluir no checklist de aceitação de v1.0
- **Plano de contingência:** se prazo comprometer instalabilidade, ajustar marketing para "experiência mobile-first" até implementação

#### Risco 7: Hot keys em `purchases` durante lançamento de produto popular
- **Probabilidade:** média
- **Impacto:** médio; lock contention pode degradar latência de webhooks por minutos
- **Mitigação:**
  - Índice `purchases(product_id, status)` para evitar full scan
  - Monitorização de latência de `webhook-payment` durante lançamentos
  - Acima de 500 webhooks simultâneos, introduzir `webhook_queue` + worker
- **Plano de contingência:** escalar plano Supabase ou ativar buffer assíncrono emergencial

#### Risco 8: Vazamento de URLs de Storage públicas para PDFs de módulo
- **Probabilidade:** média
- **Impacto:** alto; PDFs vendidos a um aluno acabam acessíveis a quem nunca pagou
- **Mitigação:**
  - URLs assinadas via `storage.createSignedUrl(path, 3600)` para PDFs em `module-content`
  - ServiceLayer encapsula geração; frontend nunca toca em URL pública direta
  - Vídeos não estão neste perímetro: são YouTube embeds e seguem o modelo de privacidade do YouTube (vídeos "unlisted" recomendados; partilha de URL exibe o vídeo, mas o controlo de acesso é de proposta de valor distinta — abordada como risco de produto, não de Storage)
  - Bucket `module-content` configurado como privado
- **Plano de contingência:** mover ficheiros afetados para novo caminho no Storage (invalida URLs antigas automaticamente) e revogar todas as signed URLs ativas via expiração forçada a `TTL=0`

#### Risco 9: Logs sem correlação cross-service inviabilizam diagnóstico
- **Probabilidade:** alta (estado atual)
- **Impacto:** médio; tempo médio de diagnóstico cresce com volume
- **Mitigação:**
  - `X-Request-Id` UUID gerado no entrypoint, propagado e logado em todas as etapas
  - Schema JSON estruturado mínimo nas Edge Functions
- **Plano de contingência:** triagem manual via timestamp + `external_transaction_id`

#### Risco 10: Falta de soft-delete bloqueia recuperação de operações destrutivas
- **Probabilidade:** baixa-média
- **Impacto:** médio; admin que apaga produto perde módulos, compras e progresso associados
- **Mitigação:**
  - Soft delete via coluna `deleted_at` em `products` e `modules` (alvo, não v1.0)
  - v1.0: confirmação dupla obrigatória no UI antes de DELETE; backup diário do Supabase
- **Plano de contingência:** restauração via backup Supabase (RTO em horas); admin comunicado da janela de recuperação

#### Risco 11: Dependência de plataformas de pagamento sem contrato de estabilidade de API
- **Probabilidade:** média; Hotmart/Kiwify/Monetizze/Eduzz alteram formato de webhook sem aviso prévio
- **Impacto:** alto; webhooks rejeitados silenciosamente, `purchases` não processadas, alunos sem acesso
- **Mitigação:**
  - Log completo do body raw de cada webhook recebido (retido 30 dias)
  - Suite de testes de payload por plataforma com fixtures
  - Alertas de taxa de erro por plataforma
- **Plano de contingência:** liberação manual de acesso via painel admin enquanto payload é corrigido

---

### ADRs e próximos passos

ADRs associados
- ADR-001 Adoção do Supabase como BaaS único em v1.0 (Auth + DB + Storage + Edge Functions)
- ADR-002 Multi-tenant por `admin_id` em vez de tabela `organizations`
- ADR-003 RLS como mecanismo único de autorização no DB; `ProtectedRoute` no frontend é apenas UX
- ADR-004 Promoção de role admin via SQL `SECURITY DEFINER` + Edge Function para signup inicial (substitui UPDATE client-side)
- ADR-005 Idempotência aplicacional de webhook por `UNIQUE(external_transaction_id)` em `purchases`
- ADR-006 URLs assinadas para conteúdo de Storage privado em vez de URLs públicas (TTL 3600 s; certificados TTL 300 s)
- ADR-007 TanStack Query como única fonte de cache de dados de servidor no frontend
- ADR-008 ServiceLayer obrigatório (`src/services/*`) entre páginas React e Supabase JS Client
- ADR-009 Sentry no frontend desde v1.0; OpenTelemetry e tracing distribuído como fase futura
- ADR-010 Sem versionamento de URL nas Edge Functions; breaking change via sufixo `-v2` na função
- ADR-011 Resend como provider de e-mail transacional em v1.0; reavaliar se volume mensal ultrapassar 10 k e-mails
- ADR-012 Adotar `supabase/migrations/` versionado como fonte de verdade do schema; abandonar script único `EXECUTAR_NO_SUPABASE.sql`

Decisões pendentes
- Backend de tracing quando OpenTelemetry for ativado (Honeycomb vs Tempo vs Jaeger); critério: tempo médio de diagnóstico > 30 min
- Plano Supabase a contratar para produção; critério: validar com testes de carga reais; provavelmente Pro mínimo
- Política de retenção de dados de compras canceladas/refundadas; critério: requisitos contábeis/fiscais a confirmar
- Encriptação do `webhook_secret` em DB; critério: avaliar coluna encriptada vs secret manager externo (Doppler, Infisical)
- CDN externa para vídeos quando Storage Supabase atingir limite; critério: Cloudflare R2 vs Bunny.net vs AWS S3 + CloudFront

Próximos passos
1. Bloqueador de go-live: corrigir privilege escalation (Risco 2); implementar `promote_to_admin` `SECURITY DEFINER`, Edge Function `promote-admin`, remover UPDATE direto em `Signup.tsx`, aplicar política RLS bloqueando UPDATE pelo próprio utilizador
2. Adicionar constraint `UNIQUE(external_transaction_id)` a `purchases` via migração SQL
3. Migrar webhook secret global para `products.webhook_secret` (Risco 3)
4. Implementar ServiceLayer em `src/services/*` com módulos por domínio; refatorar páginas para consumir
5. Implementar URLs assinadas para PDFs de módulo via `ServiceLayer.modules.getPdfSignedUrl()` (Risco 8). Vídeos não entram neste mecanismo (são YouTube embeds em v1.0)
6. Implementar PWA real com Vite PWA plugin + Workbox; validar Lighthouse PWA score >= 90 (Risco 6)
7. Configurar Sentry no frontend (ADR-009)
8. Restringir CORS das Edge Functions ao domínio de produção
9. Adicionar `X-Frame-Options: DENY` no host do frontend
10. Implementar logs estruturados + `X-Request-Id` em todas as Edge Functions (Risco 9)
11. Suite de testes de isolamento multi-tenant (Risco 4)
12. Suite de fixtures de payload por plataforma de pagamento (Risco 11)
13. FDDs derivados deste HLD (um por feature crítica):
    - FDD: Webhook de Pagamento (validação, idempotência, criação de aluno)
    - FDD: Promoção de Admin (SQL function + Edge Function de signup)
    - FDD: Geração de Certificado (PDF + Storage privado)
    - FDD: PWA Shell (manifest + Service Worker)
    - FDD: ServiceLayer (módulos por domínio)
    - FDD: Sistema de Progresso e Certificação (UPSERT em `user_progress` → verificação de 90% → trigger de certificado → notificação; fluxo unificado)
