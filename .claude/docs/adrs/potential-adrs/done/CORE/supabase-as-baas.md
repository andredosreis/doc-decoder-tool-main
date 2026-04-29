# Potential ADR: Adoção do Supabase como BaaS único em v1.0

**Module:** CORE
**Category:** Infrastructure
**Priority:** must-document
**Score:** 145/150

---

## What Was Identified

A plataforma APP XPRO (SaaS multi-tenant de cursos online) adopta Supabase como Backend-as-a-Service único em v1.0, cobrindo simultaneamente quatro capabilities: Auth (gestão de identidade e sessão), PostgreSQL (banco de dados relacional com RLS), Storage (buckets para vídeos, PDFs, ícones, certificados) e Edge Functions (Deno runtime para webhooks, geração de PDF, envio de e-mail, notificações).

Não há provider separado para nenhum dos quatro domínios. Todas as chamadas server-side passam pelo cliente Supabase JS auto-gerado. Identidade, dados, ficheiros e funções concentrados num único vendor.

Introduced: 2026-04-26 (HLD aprovado; v1.0 architectural baseline)

## Why This Might Deserve an ADR

**Impact:** Define a stack inteira de v1.0. Toda decisão de arquitectura pendente posiciona-se relativa a esta.

**Trade-offs:** Velocidade de desenvolvimento elevada, RLS embutida, dashboard único e SDK consistente vs vendor lock-in concreto em quatro capabilities; SLA dependente integralmente do Supabase (99.9%); migração futura exigiria substituir cada capability separadamente.

**Complexity:** Reduzida em v1.0; uma única infra, um único modelo mental. Cresce como dívida quando precisarmos de capabilities que Supabase não cobre.

**Team Knowledge:** Sénior, familiar com PostgreSQL e RLS; novidade com Edge Functions Deno e gestão de quotas Supabase.

**Future Implications:** Risco 1 do HLD identifica este lock-in. Estratégia de mitigação: ServiceLayer (ADR-008) abstrai chamadas para reduzir custo de migração futura.

## Evidence Found in Codebase

**Key Files:**
- src/integrations/supabase/client.ts:1
- supabase/functions/webhook-payment/index.ts:1
- EXECUTAR_NO_SUPABASE.sql:1
- supabase/functions/generate-certificate/index.ts:1
- src/hooks/useAuth.tsx:1

**Impact Analysis:**
Toda a aplicação assume Supabase. Schema ~10 tabelas em PostgreSQL Supabase. 10+ Edge Functions Deno. 5 buckets Storage. Auth com triggers SQL para sincronização com `profiles`. Introduced: 2026-04-26 como decisão fundadora de v1.0.

**Alternative Not Chosen:**
Stack desagregada: AWS Cognito (Auth) + RDS Postgres (DB) + S3 (Storage) + Lambda (Functions). Mais flexibilidade arquitectural, sem lock-in concentrado, mas complexidade operacional incompatível com tempo de desenvolvimento de v1.0 e requer expertise DevOps que não temos. Firebase também considerado e rejeitado por menor controlo sobre SQL/RLS.

## Questions to Address in ADR

- Qual o critério de revisão para considerar migração para fora de Supabase? Custo mensal? Volume de utilizadores? Limitações técnicas?
- Como mitigar lock-in de capability sem dispensar Supabase (ex: usar Resend para e-mail em vez de Supabase native)?
- Plano Supabase a contratar para produção (Free vs Pro vs Team) — confirmar antes do go-live?

## Additional Notes

ServiceLayer (FDD-003) é a principal mitigação de lock-in: ao centralizar chamadas a Supabase, reduz custo de migração futura. Já adoptado: Resend para e-mail (não Supabase native templates) para reduzir lock-in pontual nessa capability.
