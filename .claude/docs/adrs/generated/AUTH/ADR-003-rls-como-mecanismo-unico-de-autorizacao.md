# ADR-003: RLS como Mecanismo Unico de Autorizacao no DB

**Status:** Aceite
**Data:** 26-04-2026

**Depende de:**
- [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)
- [ADR-002: Multi-tenant por admin_id em vez de tabela organizations](../DATA/ADR-002-multi-tenant-por-admin-id.md)

**Usado por:**
- [ADR-004: Promoção de Role Admin via SQL SECURITY DEFINER e Edge Function](./ADR-004-promocao-role-admin-security-definer.md)

**ADRs Relacionadas:**
- [ADR-006: URLs Assinadas para Conteúdo de Storage Privado](../STORAGE/ADR-006-urls-assinadas-buckets-privados.md)
- [ADR-012: Adotar supabase/migrations versionado como fonte de verdade do schema](../SCHEMA/ADR-012-supabase-migrations-versionadas.md)

---

## 1. Contexto e Declaracao do Problema

A plataforma APP XPRO e um SaaS multi-tenant onde criadores (admins) e alunos acedem aos mesmos dados no PostgreSQL via Supabase JS Client no browser. Sem um mecanismo de autorizacao centralizado, qualquer bug no codigo do cliente ou chamada directa ao PostgREST poderia expor dados de um tenant a outro, ou permitir que um aluno acedesse conteudo de um produto sem compra aprovada.

O modelo de multi-tenancy por `admin_id` (ADR-002) exige que cada query de leitura ou escrita valide implicita e automaticamente a identidade do utilizador autenticado. Confiar apenas em verificacoes no frontend ou na ServiceLayer deixaria uma superficies de ataque aberta: qualquer chamada directa ao Supabase JS Client, sem passar pela ServiceLayer, contornaria a autorizacao.

A decisao central e: onde residir a autoridade de autorizacao de acesso a dados -- na camada aplicacional (frontend ou Edge Functions) ou no proprio banco de dados?

---

## 2. Factores de Decisao

- A defesa em profundidade exige que o ponto mais baixo da pilha (o DB) seja o guardian, independente de quem chama
- O modelo multi-tenant por `admin_id` sem tabela de organizacoes precisa de isolamento automatico e nao opt-in
- A ausencia de um backend proprio (apenas Edge Functions serverless) torna impossivel interpor uma camada de autorizacao centralizada antes de cada query
- Qualquer gap de policy deve resultar em acesso negado por default, nunca em acesso aberto inadvertido
- O custo de reimplementar autorizacao numa migracao futura de DB e significativo e deve ser documentado como constraining factor

---

## 3. Opcoes Consideradas

- **Opcao A:** Row Level Security exclusivo no PostgreSQL como unica autoridade de autorizacao
- **Opcao B:** Autorizacao aplicacional na ServiceLayer (frontend ou Edge Functions), sem RLS
- **Opcao C:** Controlo via JWT claims customizados sem policies SQL

---

## 4. Decisao

Opcao A escolhida: Row Level Security no PostgreSQL e o mecanismo exclusivo e autoritativo de autorizacao no banco de dados. Todas as tabelas com dados sensiveis possuem policies especificas que validam `auth.uid()` e `has_role(auth.uid(), role)` antes de permitir qualquer operacao SELECT, INSERT, UPDATE ou DELETE.

O componente `ProtectedRoute` no frontend serve apenas para UX (redireccionar admins para `/admin/*` e alunos para `/student/*`), sem efeito de seguranca real. A defesa e inteiramente server-side via RLS, o que garante que chamadas directas ao PostgREST ou ao Supabase JS Client sem passar pela ServiceLayer estao igualmente protegidas.

---

## 5. Prós e Contras das Opcoes

### Opcao A: RLS exclusivo no PostgreSQL

- Positivo: defesa em profundidade no nivel mais baixo possivel; impossivel contornar via codigo aplicacional
- Positivo: isolamento multi-tenant automatico sem codigo adicional em cada query
- Positivo: policies cobrem todas as operacoes (SELECT, INSERT, UPDATE, DELETE) de forma declarativa
- Negativo: debugging de policies pode ser silencioso; acesso negado retorna 0 linhas em vez de erro 403
- Negativo: cada nova tabela exige policies correctas; esquecimento resulta em bloqueio total ou abertura total
- Negativo: migrar para outro banco de dados exigiria reimplementar toda a autorizacao noutra camada

### Opcao B: Autorizacao aplicacional na ServiceLayer

- Positivo: logica de autorizacao em TypeScript, mais facil de testar unitariamente
- Positivo: erros de autorizacao podem retornar mensagens explicitias (403 com detalhe)
- Negativo: chamada directa ao Supabase JS Client contorna toda a autorizacao; superficie de ataque permanece aberta
- Negativo: cada Edge Function e cada query precisam de implementar autorizacao independentemente

### Opcao C: JWT claims customizados

- Positivo: autorizacao viaja no token sem round-trip ao DB
- Negativo: menor expressividade que policies SQL completas; impossivel exprimir condicoes por linha (ex: "aluno tem compra aprovada para este produto")
- Negativo: claims desactualizados ate ao proximo refresh do token; inconsistencia de estado possivel

---

## 6. Consequencias

A adopcao de RLS como autoridade exclusiva cria um pacto arquitectural que todos os desenvolvedores devem conhecer: qualquer nova tabela com dados de utilizador precisa de policies correctas antes de ser usada em producao. A ausencia de policy num contexto de `ENABLE ROW LEVEL SECURITY` sem `FORCE ROW LEVEL SECURITY` pode resultar em acesso total para o role `service_role`, o que e intencional para Edge Functions mas deve ser conscientemente gerido.

O Risco 4 do HLD (cross-tenant data leak por RLS mal configurada) permanece com probabilidade media na ausencia de testes automatizados de isolamento multi-tenant. A mitigacao requer uma suite de testes que valide, para cada tabela, que um utilizador autenticado como tenant A nao consegue ler, escrever ou apagar dados do tenant B -- nem por queries directas nem via relacoes.

A migracao futura para outro banco de dados (referenciada como divida em ADR-001) tem custo significativo neste modelo: toda a logica de autorizacao esta codificada em SQL dentro do PostgreSQL e nao existe numa camada portavel. Este e um trade-off consciente documentado na matriz de portabilidade do HLD.

Auditoria formal das policies RLS executada **por release** (a cada deploy major). Responsável: o autor do release. Auditoria ad-hoc obrigatória sempre que nova tabela com dados de utilizador for adicionada ao schema.

Critérios mínimos para testes automatizados de isolamento multi-tenant: para cada tabela com `user_id` ou ownership por admin, três cenários obrigatórios devem ser cobertos: (a) leitura cruzada bloqueada, (b) escrita cruzada bloqueada, (c) delete cruzado bloqueado. Execução em CI antes de merge para `main`. Suite formal não existe em v1.0; testes manuais documentados em runbook são aceites até PR de Sentry estar mergeado.

Checklist de revisão RLS é mantida em `.github/PULL_REQUEST_TEMPLATE.md` (a criar) com cinco itens obrigatórios: (a) RLS activada em qualquer tabela nova adicionada, (b) policies cobrem as quatro operações (SELECT, INSERT, UPDATE, DELETE) ou justificação documentada para subset, (c) RLS testada manualmente com duas contas de utilizadores diferentes, (d) zero uso de `service_role` em código frontend, (e) policies auditadas explicitamente pelo reviewer no PR review.

---

## 7. Referencias

- `EXECUTAR_NO_SUPABASE.sql:50` -- policies RLS de todas as tabelas
- `src/hooks/useAuth.tsx:1` -- ProtectedRoute como controlo de UX apenas
- `src/integrations/supabase/client.ts:1` -- cliente Supabase tipado usado em todas as queries
- `.claude/docs/HLD.md` -- Risco 4 (cross-tenant leak), seccao Seguranca/Autorizacao e matriz de portabilidade
