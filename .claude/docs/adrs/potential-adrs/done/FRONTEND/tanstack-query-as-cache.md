# Potential ADR: TanStack Query como cache única de dados de servidor no frontend

**Module:** FRONTEND
**Category:** Architecture
**Priority:** must-document
**Score:** 110/150

---

## What Was Identified

TanStack Query (`useQuery` e `useMutation`) é a única camada de cache de dados de servidor no cliente React. Sem Redux, Zustand ou store global para server state. Hooks dedicados por domínio em `src/hooks/queries/*` (useProducts, useModules, usePurchases, useProgress, useCertificates, useNotifications, useAuth).

Cada domínio tem `staleTime` configurado por característica do dado: 5 min para produtos (mudam raramente), 30 min para módulos (estáveis após publicação), 2 min para compras, 1 hora para certificados (imutáveis após emissão), 0 para progresso e notificações (sempre fresh). `QueryKeys` são centralizados em `src/hooks/queries/keys.ts` factory para evitar drift.

Mutations invalidam queries afectadas via `queryClient.invalidateQueries({ queryKey })` no `onSuccess`.

Introduced: 2026-04-26 (FDD-003 ServiceLayer formaliza padrão)

## Why This Might Deserve an ADR

**Impact:** Padrão de fetching e caching em toda a aplicação React. Toda a interacção com Supabase passa por aqui.

**Trade-offs:** Padrão moderno + invalidação granular + dev tools úteis vs curva de aprendizagem; sem global store para client state (mas client state é minimal nesta app — auth state vive em React Context).

**Complexity:** Média. Configuração inicial requer pensar em staleTime e queryKeys; uma vez estabilizado, hooks novos são triviais.

**Team Knowledge:** Já adoptado e em uso no projecto.

**Future Implications:** Migração para outro cache (SWR, RTK Query) exigiria refactor de todos os hooks. Lock-in moderado mas API similar entre alternativas.

## Evidence Found in Codebase

**Key Files:**
- package.json:43 (@tanstack/react-query)
- src/hooks/queries/useProducts.ts:1
- src/lib/queryClient.ts:1 (a criar via FDD-003)
- src/hooks/queries/keys.ts:1
- .claude/docs/FDD-service-layer.md:1

**Impact Analysis:**
Adopção uniforme em todos os hooks do frontend. Configuração de QueryClient centralizada; `onError` global trata erros não capturados localmente. Introduced: 2026-04-26.

**Alternative Not Chosen:**
SWR (alternativa popular). Rejeitada por TanStack Query estar já adoptado e ter feature-set superior (mutations, optimistic updates, infinite queries). Considerou-se também Redux Toolkit Query; rejeitada por trazer Redux junto, que não é necessário para client state mínimo desta app.

## Questions to Address in ADR

- Política de invalidação cross-domain (ex: criar produto deve invalidar quê exactamente)?
- Critério de decidir entre invalidate vs setQueryData (optimistic) por mutation?
- Persistência de cache entre sessões via localStorage (TanStack Query Persist)? v1.0 ou v2.0?

## Additional Notes

`onError` global no QueryClient trata mutations não capturadas com toast destrutivo genérico; hooks contextuais podem interceptar erros conhecidos (ex: `23505`) com mensagens específicas e re-lançar para o global o resto. Padrão definido em FDD-003 §7.
