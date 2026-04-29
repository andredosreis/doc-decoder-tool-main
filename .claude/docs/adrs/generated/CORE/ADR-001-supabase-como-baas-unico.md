# ADR-001: Adoção do Supabase como BaaS Único em v1.0

**Status:** Aceito
**Data:** 26-04-2026

**Usado por:**
- [ADR-002: Multi-tenant por admin_id em vez de tabela organizations](../DATA/ADR-002-multi-tenant-por-admin-id.md)
- [ADR-003: RLS como Mecanismo Unico de Autorizacao no DB](../AUTH/ADR-003-rls-como-mecanismo-unico-de-autorizacao.md)
- [ADR-004: Promoção de Role Admin via SQL SECURITY DEFINER e Edge Function](../AUTH/ADR-004-promocao-role-admin-security-definer.md)
- [ADR-005: Idempotência de Webhook por UNIQUE(external_transaction_id)](../BILLING/ADR-005-idempotencia-webhook-unique-constraint.md)
- [ADR-006: URLs Assinadas para Conteúdo de Storage Privado](../STORAGE/ADR-006-urls-assinadas-buckets-privados.md)
- [ADR-008: ServiceLayer obrigatorio entre paginas React e Supabase JS Client](../FRONTEND/ADR-008-service-layer-obrigatorio.md)
- [ADR-010: Sem versionamento de URL nas Edge Functions; breaking change via sufixo -v2](../API/ADR-010-sem-versionamento-url-edge-functions-sufixo-v2.md)
- [ADR-011: Resend como provider de e-mail transacional em v1.0](../EMAIL/ADR-011-resend-como-provider-de-email-transacional.md)
- [ADR-012: Adotar supabase/migrations versionado como fonte de verdade do schema](../SCHEMA/ADR-012-supabase-migrations-versionadas.md)

---

## 1. Contexto e Declaração do Problema

O APP XPRO é uma plataforma SaaS multi-tenant para entrega de cursos online que necessitava, em v1.0, cobrir quatro capabilities de infraestrutura de forma integrada: gestão de identidade e sessão, persistência relacional com controlo de acesso, armazenamento de binários e lógica server-side para processamento de webhooks e geração de documentos.

A equipa é composta por um desenvolvedor sénior com domínio sólido de PostgreSQL e RLS, sem expertise DevOps dedicada e com prazo de entrega de v1.0 que tornava inviável a operação de infraestrutura própria. O produto precisava de isolamento multi-tenant nativo, autenticação com convite por e-mail, signed URLs para conteúdo privado e Edge Functions para processamento de webhooks de plataformas de pagamento externas (Hotmart, Kiwify, Monetizze, Eduzz).

A escolha do provider de infraestrutura fundou a stack completa de v1.0 e toda decisão arquitectural posterior posiciona-se relativamente a esta. O HLD (v1.0, 2026-04-26) documenta uma matriz de portabilidade explícita reconhecendo a dependência: Auth e Edge Functions têm custo de migração alto; DB e Storage têm equivalentes portáveis.

## 2. Fatores de Decisão

- Velocidade de entrega de v1.0 sem equipa de operações ou DevOps dedicado
- Necessidade de RLS nativa no banco para isolamento multi-tenant por `admin_id`
- Gestão de identidade com suporte a convites, PKCE e Admin Auth API para onboarding de alunos
- Dashboard unificado e SDK consistente para reduzir overhead de integração entre capabilities
- SLA de plataforma dependente do vendor único; 99.5% mensal identificado como meta aceitável
- Critério de revisão definido: revisitar quando MAU > 5 000 OU custo mensal Supabase > €500 OU bloqueio técnico não contornável (limite de Storage atingido, concurrent connections do Realtime esgotadas)

## 3. Opções Consideradas

- **Supabase como BaaS unificado** (Auth + PostgreSQL + Storage + Edge Functions)
- **Stack desagregada AWS** (Cognito + RDS + S3 + Lambda)
- **Firebase** (Auth + Firestore + Storage + Cloud Functions)

## 4. Decisão

Opção escolhida: **Supabase como BaaS unificado**, porque concentra as quatro capabilities necessárias num único provider com RLS nativa no PostgreSQL, SDK tipado auto-gerado, Auth com Admin API e dashboard operacional sem custo de DevOps. Esta combinação é a única que satisfaz simultaneamente o prazo de v1.0 e os requisitos de isolamento multi-tenant por RLS.

A decisão foi tomada com consciência explícita do lock-in em quatro capabilities simultaneamente, mitigado por duas medidas já adoptadas: ServiceLayer obrigatório em `src/services/` encapsulando todas as chamadas ao cliente Supabase (reduz custo de substituição futura), e Resend como provider de e-mail transacional em vez dos templates nativos do Supabase (elimina lock-in nessa capability específica).

Plano Supabase para produção: **Pro** (€25/mês) confirmado antes do go-live. Validar `generate-certificate` em testes de carga em staging com plano equivalente para confirmar tempo de execução < 8 s.

## 5. Prós e Contras das Opções

### Supabase como BaaS unificado

- Positivo: RLS nativa no PostgreSQL com políticas por `auth.uid()` elimina necessidade de camada de autorização adicional
- Positivo: Admin Auth API server-side (`auth.admin.*`) suporta criação de utilizadores via webhook sem expor credenciais no cliente
- Positivo: Um único modelo mental e SDK para Auth, DB, Storage, Edge Functions e Realtime
- Negativo: Lock-in concentrado em quatro capabilities; outage do Supabase derruba toda a plataforma; migração em incidente é inviável

### Stack desagregada AWS

- Positivo: Flexibilidade arquitectural máxima; sem dependência de vendor único; cada serviço com SLA independente
- Negativo: Requer expertise DevOps que a equipa não possui; tempo de configuração e integração incompatível com prazo de v1.0
- Negativo: Sem RLS nativa; autorização multi-tenant requereria camada adicional de middleware

### Firebase

- Positivo: BaaS maduro com Auth, Storage e Cloud Functions; ecossistema Google
- Negativo: Firestore é NoSQL sem suporte a RLS; consultas relacionais complexas e isolamento multi-tenant por `admin_id` exigem lógica aplicacional adicional
- Negativo: Menor controlo sobre SQL, sem PostgreSQL nativo; migra o problema de lock-in sem resolver o requisito de RLS

## 6. Consequências

A plataforma assume Supabase como infraestrutura total em v1.0, com schema em PostgreSQL 15 com RLS, Edge Functions em runtime Deno, Storage com buckets privados e Auth com PKCE. O SLA da plataforma (99.5% mensal) é derivado integralmente do SLA do Supabase (99.9%), combinado com Resend e CDN de frontend em cadeia, o que torna inviável reivindicar SLA superior sem contrato próprio.

O custo de migração futura é assimétrico por capability: DB e Storage têm equivalentes portáveis (PostgreSQL gerido, S3-compatible); Auth e Edge Functions têm custo de substituição alto e requerem re-implementação em provider alternativo. O ServiceLayer (ADR-008) é a principal salvaguarda arquitectural que reduz este custo ao centralizar o acoplamento num único ponto.

Critério de avaliação de migração parcial: > 500 GB/mês de transferência em certificados, PDFs de módulo e imagens de produto. Vídeos não pesam neste cálculo (são YouTube embeds em v1.0; servidos pela própria YouTube). Avaliação inclui Cloudflare R2 (egress free), Bunny.net (€0.01/GB) e AWS S3 + CloudFront.

## 7. Referências

- `src/integrations/supabase/client.ts:1` — cliente Supabase JS auto-gerado; ponto único de acesso ao provider
- `supabase/functions/webhook-payment/index.ts:1` — Edge Function crítica; processa webhooks de quatro plataformas de pagamento
- `supabase/functions/generate-certificate/index.ts:1` — Edge Function com restrição de plano (incompatível com Free por limite de CPU)
- `src/hooks/useAuth.tsx:1` — integração com Supabase Auth; gestão de sessão e ProtectedRoute
- `EXECUTAR_NO_SUPABASE.sql:1` — schema completo do banco; baseline de v1.0
