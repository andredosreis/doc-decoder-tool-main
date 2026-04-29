# Potential ADR: RLS como mecanismo único de autorização no DB

**Module:** AUTH
**Category:** Security
**Priority:** must-document
**Score:** 140/150

---

## What Was Identified

Toda autorização em queries Supabase é feita por Row Level Security policies em PostgreSQL. Cada tabela com dados sensíveis tem policies específicas (`Users can view own ...`, `Admins can manage their products`, etc.) que comparam `auth.uid()` ou `has_role(auth.uid(), 'admin')` com colunas da linha. O componente `ProtectedRoute` em React verifica role para redireccionar utilizadores entre `/admin/*` e `/student/*`, mas não tem efeito de segurança real: a defesa é exclusivamente server-side via RLS.

Frontend confia que RLS bloqueia ou autoriza implicitamente; não duplica checks aplicacionalmente.

Introduced: 2026-04-26 (schema inicial)

## Why This Might Deserve an ADR

**Impact:** Modelo de segurança end-to-end da aplicação. Qualquer regra de autorização passa por aqui.

**Trade-offs:** Defence-in-depth nativa do PostgreSQL + sem código aplicacional duplicado + isolamento no nível mais baixo possível vs debugging de policies pode ser complexo (erros silenciosos retornam 0 linhas em vez de 403); performance impact se policies usarem subqueries pesadas.

**Complexity:** Cada nova tabela exige policies; pacto crítico que não pode ser esquecido. Ausência de policy = bloqueio total ou abertura total dependendo do default.

**Team Knowledge:** Sénior familiar com SQL e RLS. Risco médio de erro humano em policies novas; mitigação via code review e testes de isolamento (Risco 4 do HLD).

**Future Implications:** Migração para outro DB (ex: planeada como dívida em ADR-001) requer reimplementar autorização noutra camada (aplicacional ou do novo DB). Custo significativo.

## Evidence Found in Codebase

**Key Files:**
- EXECUTAR_NO_SUPABASE.sql:50 (todas as policies)
- src/hooks/useAuth.tsx:1 (ProtectedRoute apenas UX)
- src/integrations/supabase/client.ts:1

**Impact Analysis:**
~10 tabelas com RLS activa. Policies cobrem SELECT, INSERT, UPDATE, DELETE conforme necessário. Padrão recorrente: `auth.uid() = user_id` para dados próprios; `has_role(auth.uid(), 'admin')` para admin operations; subqueries em `purchases` para acesso de aluno a conteúdo. Introduced: 2026-04-26.

**Alternative Not Chosen:**
Autorização aplicacional na ServiceLayer (frontend ou Edge Functions) em vez de RLS. Rejeitada por abrir gap se alguém escapar a ServiceLayer (ex: chamada directa do Supabase JS no futuro); RLS no DB é defesa em profundidade independente do código aplicacional. Considerou-se também controlo via JWT claims customizados, rejeitado por menor expressividade que policies SQL completas.

## Questions to Address in ADR

- Como auditar policies regularmente? Periodicidade?
- Critérios de testes automatizados de isolamento multi-tenant?
- Política de revisão de policy em code review (checklist obrigatório)?

## Additional Notes

Risco 4 do HLD ("Cross-tenant data leak por RLS mal configurada") tem probabilidade média sem testes automatizados. Mitigação: testes automatizados de isolamento + code review obrigatório com checklist RLS antes de merge em main.
