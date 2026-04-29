# ADR-004: Promoção de Role Admin via SQL SECURITY DEFINER e Edge Function

**Status:** Aceite
**Data:** 26-04-2026

**Depende de:**
- [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)
- [ADR-003: RLS como Mecanismo Unico de Autorizacao no DB](./ADR-003-rls-como-mecanismo-unico-de-autorizacao.md)

**ADRs Relacionadas:**
- [ADR-011: Resend como provider de e-mail transacional em v1.0](../EMAIL/ADR-011-resend-como-provider-de-email-transacional.md)

---

## 1. Contexto e Problema

A plataforma APP XPRO opera um modelo multi-tenant onde admins criam e vendem cursos de forma isolada. O mecanismo original de onboarding de admins executava uma actualização directa em `user_roles` a partir do cliente React, sem nenhuma validação server-side. Qualquer utilizador autenticado podia invocar essa actualização e tornar-se admin, obtendo acesso a dados de todos os criadores da plataforma.

Este padrão foi identificado como Risco 2 no HLD e classificado como bloqueador de go-live: a vulnerabilidade existe em produção e expoe a integridade do isolamento multi-tenant. O facto de o RLS em `user_roles` não bloquear UPDATE pelo proprio utilizador tornava o ataque trivial, sem necessidade de explorar qualquer gap adicional.

A decisao foi substituir o UPDATE client-side por dois mecanismos server-side mutuamente exclusivos: uma funcao SQL com execucao privilegiada para promoções feitas por admin ja autenticado, e uma Edge Function com token de ambiente para o bootstrap do primeiro admin da plataforma, cenario em que nenhum admin preexiste para autorizar a operacao.

## 2. Condutores de Decisao

- Vulnerabilidade activa de escalada de privilégios bloqueia o go-live com utilizadores reais.
- O modelo de isolamento multi-tenant depende inteiramente de RLS; qualquer escrita nao autorizada em `user_roles` compromete toda a plataforma.
- A validacao de autorizacao deve ser atomica e residir no servidor, nao no cliente, pois qualquer check em JavaScript pode ser contornado.
- O cenario de bootstrap (primeiro admin, sem admin preexistente) exige um mecanismo separado e de uso unico.
- O padrao estabelecido deve ser reutilizavel para mudancas de role futuras, se novos roles forem introduzidos.
- Complexidade operacional do token de bootstrap deve ser minimizada e o risco de vazamento mitigado por design.

## 3. Opcoes Consideradas

- **Opcao A: Funcao SQL SECURITY DEFINER + Edge Function de bootstrap** (escolhida)
- **Opcao B: UPDATE client-side com checks adicionais no aplicativo**
- **Opcao C: RLS estrita com Edge Function exclusiva para todas as promocoes**

## 4. Resultado da Decisao

Escolhida a Opcao A, porque a funcao SQL `promote_to_admin` com `SECURITY DEFINER` garante validacao atomica de autorizacao no nivel do banco de dados antes de qualquer escrita em `user_roles`, eliminando a superficie de ataque client-side. A Edge Function `promote-admin` cobre o caso de bootstrap com token de ambiente de uso unico, que apos a primeira execucao fica inativo por design (verificacao de admin existente retorna 409). A politica RLS adicionada em `user_roles` bloqueando UPDATE pelo proprio utilizador actua como camada defensiva redundante.

[NECESSITA REVISAO: Definir politica formal de rotacao do token de bootstrap `ADMIN_BOOTSTRAP_TOKEN` apos o primeiro uso - se o token deve ser removido do ambiente imediatamente ou mantido com restricao de acesso.]

## 5. Prós e Contras das Opcoes

### Opcao A: Funcao SQL SECURITY DEFINER + Edge Function de bootstrap

- Bom: validacao de autorizacao atomica no banco elimina qualquer possibilidade de bypass client-side.
- Bom: SECURITY DEFINER delimita o escopo privilegiado a uma unica operacao auditavel, sem elevar o privilegio de toda a sessao.
- Bom: Edge Function de bootstrap e de uso unico por design; token fica inutilizavel apos o primeiro admin criado.
- Ruim: SECURITY DEFINER exige cuidado com `search_path` para evitar SQL injection via substituicao de schema; parametro `target_user_id` deve ser tipado como `uuid`.

### Opcao B: UPDATE client-side com checks adicionais no aplicativo

- Bom: sem adicao de componentes server-side; implementacao mais simples.
- Ruim: fundamentalmente vulneravel; qualquer cliente pode ignorar checks em JavaScript e executar o UPDATE directamente via SDK.
- Ruim: nao resolve o problema de autorizacao; apenas adiciona obscurecimento.

### Opcao C: RLS estrita com Edge Function exclusiva para todas as promocoes

- Bom: centraliza toda escrita privilegiada em Edge Functions, sem funcoes SQL com SECURITY DEFINER.
- Ruim: adiciona latencia de rede a operacoes de promocao que um admin ja autenticado poderia executar via RPC com latencia de banco.
- Ruim: Edge Function de promocao subsequente precisaria de Service Role Key para contornar RLS, replicando o privilegio elevado sem ganho de seguranca adicional sobre a Opcao A.

## 6. Consequencias

A remocao do UPDATE directo em `src/pages/Signup.tsx` encerra a vulnerabilidade activa imediatamente. A politica RLS adicional em `user_roles` bloqueando UPDATE pelo proprio utilizador garante que mesmo que uma chamada client-side seja tentada directamente via SDK, o banco a rejeita sem promover. Toda promocao subsequente passa pela funcao SQL `promote_to_admin` chamada via RPC autenticado, com log auditavel da operacao.

O padrao SECURITY DEFINER estabelecido e reutilizavel para qualquer escrita privilegiada futura, incluindo roles adicionais como `super_admin` se o produto evoluir nessa direccao. A Edge Function `promote-admin` com os tres modos (bootstrap, create_invite, use_invite) centraliza toda a logica de onboarding de admins em um unico ponto de auditoria.

[NECESSITA REVISAO: Definir estrategia de auditoria estruturada das chamadas a `promote_to_admin` - se log estruturado na funcao SQL e suficiente ou se e necessario tabela de auditoria dedicada com timestamp, caller_id e target_user_id.]

## 7. Referencias

- `.claude/docs/HLD.md` (Risco 2, secao Seguranca, secao ADRs e proximos passos)
- `.claude/docs/FDD-promocao-admin.md` (fluxos bootstrap, create_invite, use_invite; schema admin_invites; politicas RLS)
- `src/pages/Signup.tsx:1` (UPDATE directo a remover)
- `EXECUTAR_NO_SUPABASE.sql:1` (funcao promote_to_admin + politica RLS em user_roles)
