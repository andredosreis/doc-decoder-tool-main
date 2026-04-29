# Potential ADR: ServiceLayer obrigatório entre páginas React e Supabase JS

**Module:** FRONTEND
**Category:** Architecture
**Priority:** must-document
**Score:** 120/150

---

## What Was Identified

Páginas React não chamam o cliente Supabase directamente. Toda query passa por `src/services/<domain>.service.ts`. Domínios definidos: products, purchases, modules, progress, certificates, notifications, auth, storage. Helper interno `_edge.ts` encapsula chamadas a Edge Functions.

Resolve "Problema 5" do objectivo técnico do HLD: estado actual tem 18 páginas com chamadas directas ao Supabase, misturando lógica de UI com data access; impossibilita testes unitários, dificulta refactor e gera tratamento de erros inconsistente.

Padrão de serviço: objecto literal exportado como constante (`export const productsService = { ... }`), sem classes nem injecção de dependências em v1.0. Cliente Supabase importado directamente em cada serviço.

Introduced: 2026-04-26 (FDD-003 ServiceLayer formaliza; refactor em curso por PRs incrementais)

## Why This Might Deserve an ADR

**Impact:** Estrutura inteira do frontend após migração. CI rule futura pode bloquear PRs que importem `supabase` fora de `src/services/`.

**Trade-offs:** Testabilidade + reuso entre páginas + tratamento de erros centralizado + facilita migração futura (Risco 1 do HLD: lock-in Supabase) vs cerimónia adicional para queries simples; nova camada de indirecção.

**Complexity:** Média na definição inicial; baixa após estabelecida (cada novo domínio segue o padrão).

**Team Knowledge:** Padrão clássico (Repository / Service Layer); team familiar.

**Future Implications:** Migração de provider (Risco 1) tem custo limitado ao ServiceLayer e Edge Functions, sem refactor de páginas.

## Evidence Found in Codebase

**Key Files:**
- src/services/products.service.ts:1 (template; a criar via FDD-003 PR 2)
- src/services/_edge.ts:1 (helper de Edge Functions; a criar)
- src/types/domain.ts:1
- src/lib/supabase-errors.ts:1 (helper isSupabaseError; a criar)
- .claude/docs/FDD-service-layer.md:1

**Impact Analysis:**
Estado actual: 18 páginas com chamadas directas a `supabase`. Plano de PRs (FDD-003 §8): PR 0 fundações; PRs 1-6 por domínio; após PR 6 a regra "sem chamadas directas fora de services" entra em vigor. Introduced: 2026-04-26 com plano de adopção incremental.

**Alternative Not Chosen:**
Hooks chamando `supabase` directamente (estado actual em produção). Rejeitada por mistura de UI/data access, dificuldade de testes, tratamento de erro inconsistente, impossibilidade de mudar de provider sem refactor de cada página. Considerou-se também Repository pattern com classes e dependency injection; rejeitada por ser overkill para o tamanho de v1.0 (object literal é tree-shakeable e suficiente).

## Questions to Address in ADR

- CI rule (ESLint custom rule ou import-restrictions) para bloquear `import { supabase }` fora de `src/services/`?
- Quando enforce a regra estritamente — após qual PR?
- Service-role queries (Edge Functions): manter padrão similar mas separado ou unificar?

## Additional Notes

FDD-003 detalha estrutura completa de ficheiros, padrão de retorno (arrays vazios para listas, null para single, exception para erro), QueryKeys factory, e plano de migração incremental por PRs. Regra temporária durante migração (PRs 1-5): páginas não migradas podem continuar com supabase directo.
