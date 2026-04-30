# ADR-011 — Acesso de Alunos Exclusivamente via Convite Administrativo

## Status
Aceite — 2026-04-30

## Contexto

O APP XPRO tem dois personas: **admin** (cria produtos e módulos) e **aluno** (consome conteúdo comprado). Desde o início, o acesso de alunos era criado de duas formas possíveis:

1. Automaticamente pelo webhook de pagamento (`webhook-payment`) quando uma compra é aprovada numa plataforma externa (Hotmart, Kiwify, etc.).
2. Manualmente pelo admin via Edge Function `admin-invite-student`, que cria a conta e envia um email de configuração de password.

Não existe página de auto-registo para alunos — o `Signup.tsx` cria exclusivamente contas de admin. Contudo, esta regra não estava explicitamente documentada nem reforçada na UI, criando ambiguidade sobre o fluxo esperado.

Durante a fase de testes E2E (2026-04-30), ficou evidente que o modelo de acesso para alunos precisava de ser formalizado: o aluno nunca escolhe criar conta — recebe um convite e acede com as credenciais fornecidas pelo sistema.

## Decisão

**O acesso de alunos ao APP XPRO é exclusivamente via convite administrativo.** Não existe, nem existirá, auto-registo para alunos.

Os dois caminhos de criação de conta permanecem válidos, mas ambos são iniciados pelo admin ou pela plataforma de pagamento — nunca pelo aluno:

| Canal | Quem inicia | Como |
|---|---|---|
| Compra via webhook | Plataforma de pagamento (Hotmart/Kiwify/etc.) | `webhook-payment` → `auth.admin.createUser` |
| Convite directo | Admin no painel | `admin-invite-student` → `auth.admin.createUser` + email de setup |

Após a criação, o aluno recebe um email com um link para definir a sua password (fluxo `PASSWORD_RECOVERY`). O aluno acede depois em `/auth/student-login` com as credenciais que definiu.

A UI do `StudentLogin.tsx` foi actualizada para reflectir explicitamente este modelo: "Acesso exclusivo via convite do administrador".

## Consequências

**Positivas:**
- Elimina ambiguidade: fica claro que alunos não se auto-registam.
- Simplifica o onboarding: o admin controla quem entra na plataforma.
- Consistente com o modelo de negócio SaaS multi-tenant (o admin paga e gere os seus alunos).
- Remove a necessidade de validar self-registration de alunos nos testes E2E.

**Negativas / Trade-offs:**
- O admin é o único ponto de entrada para alunos. Se o admin não convidar, o aluno não acede — não há fallback de auto-registo.
- O fluxo de webhook depende de integração externa estar correctamente configurada; falhas no webhook bloqueiam alunos que pagaram.

## Ficheiros afectados

| Ficheiro | Alteração |
|---|---|
| `src/pages/auth/StudentLogin.tsx` | Mensagem actualizada para "Acesso exclusivo via convite" |
| `supabase/functions/admin-invite-student/index.ts` | Ponto de entrada principal (sem alteração de lógica) |
| `supabase/functions/webhook-payment/index.ts` | Ponto de entrada via pagamento (sem alteração de lógica) |
| `.claude/docs/test-cases-e2e-student.md` | Secção "Como criar conta de aluno para testes" adicionada |

## Relacionado com

- ADR-003 — RLS como mecanismo único de autorização (o RLS é quem bloqueia alunos sem compra, não a UI)
- ADR-004 — Promoção de role admin via SECURITY DEFINER
- FDD-webhook-pagamento.md — criação de aluno via compra aprovada
