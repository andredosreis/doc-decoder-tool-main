# ADR-007: TanStack Query como cache exclusiva de dados de servidor no frontend

**Status:** Aceite
**Data:** 26/04/2026

**Depende de:** [ADR-008: ServiceLayer obrigatorio entre paginas React e Supabase JS Client](./ADR-008-service-layer-obrigatorio.md)

**ADRs Relacionadas:** [ADR-009: Sentry no frontend desde v1.0; OpenTelemetry como fase futura](../OBSERVABILITY/ADR-009-sentry-no-frontend-v1-otel-fase-futura.md)

---

## 1. Contexto e Problema

O APP XPRO é uma SPA React sem backend próprio: toda a comunicação com dados de servidor passa pelo Supabase JS Client. Com 18 páginas que, na v1.0 inicial, acessavam o Supabase diretamente nos componentes, a aplicação não tinha nenhuma camada de cache nem estratégia uniforme de invalidação. Dados repetidos eram buscados a cada montagem de componente; erros eram tratados de forma inconsistente; e não havia mecanismo centralizado para sincronizar o estado do servidor com a UI após mutações.

A decisão foi adotar TanStack Query v5 como a única camada de cache de dados de servidor no cliente React, cobrindo todos os domínios: produtos, módulos, compras, progresso, certificados, notificações e autenticação. Não há Redux, Zustand ou outra store global para server state. O estado de cliente mínimo desta aplicação (sessão de autenticação) permanece em React Context via `useAuth`.

O padrão foi formalizado pela FDD-003 ServiceLayer, que define hooks dedicados por domínio em `src/hooks/queries/` consumindo serviços em `src/services/`, com `QueryKeys` centralizados em `src/hooks/queries/keys.ts` para evitar drift entre domínios.

---

## 2. Fatores de Decisão

- Toda interação com Supabase no frontend deve passar por uma camada de cache para evitar buscas redundantes e garantir consistência de UI.
- A aplicação tem perfis de dados distintos: produtos e módulos mudam raramente; progresso e notificações precisam ser sempre frescos.
- Mutações devem invalidar automaticamente as queries afetadas para manter o estado da UI sincronizado com o servidor.
- A stack já usa TanStack Query; adotar uma segunda biblioteca de cache criaria fragmentação sem ganho claro.
- O volume de client state é mínimo (apenas sessão de auth), tornando desnecessária uma store global dedicada a estado de cliente.
- A equipe precisa de DevTools úteis para depurar estado de cache em desenvolvimento.

---

## 3. Opções Consideradas

- **TanStack Query v5 como única camada de cache** (opção escolhida)
- **SWR com context manual para server state**
- **Redux Toolkit Query com RTK como store global**

---

## 4. Resultado da Decisão

Opção escolhida: TanStack Query v5 como única camada de cache, porque já estava adotado no projeto, oferece suporte nativo a mutations com invalidação granular via `invalidateQueries`, possui DevTools integradas, e seu modelo de `staleTime` por query permite calibrar o comportamento de revalidação conforme a natureza de cada domínio de dados.

A estratégia de `staleTime` por domínio foi definida diretamente na FDD-003: 5 minutos para produtos, 30 minutos para módulos, 2 minutos para compras, 1 hora para certificados, e zero para progresso e notificações. Mutations invalidam as queries afetadas no `onSuccess` via `queryClient.invalidateQueries`.

[NECESSITA ENTRADA: A política exata de invalidação cross-domain ainda não está documentada - por exemplo, criar um produto deve invalidar apenas `products.all` ou também queries dependentes de módulos e compras? Definir e registar em `src/hooks/queries/keys.ts`.]

---

## 5. Prós e Contras das Opções

### TanStack Query v5 como única camada de cache

- Bom: invalidação granular por `queryKey` evita refetches desnecessários em outros domínios.
- Bom: `staleTime` configurável por query permite estratégias diferentes para dados com ciclos de vida distintos.
- Bom: DevTools nativas aceleram diagnóstico de problemas de cache em desenvolvimento.
- Ruim: curva de aprendizagem inicial para calibrar `staleTime`, `gcTime` e estratégia de invalidação vs. `setQueryData` otimista.

### SWR com context manual para server state

- Bom: API mais simples para casos de uso básicos de fetch e revalidação.
- Ruim: suporte a mutations é minimal; invalidação cross-query requer gerenciamento manual.
- Ruim: ausência de DevTools equivalentes às do TanStack Query dificulta diagnóstico.

### Redux Toolkit Query com RTK como store global

- Bom: integração nativa com Redux para unificar server state e client state em uma store.
- Ruim: traz Redux como dependência obrigatória; o client state desta aplicação é mínimo e não justifica o overhead.
- Ruim: aumenta complexidade de configuração sem benefício proporcional ao escopo da v1.0.

---

## 6. Consequências

A adoção do TanStack Query como camada exclusiva de cache elimina buscas duplicadas ao Supabase e uniformiza o tratamento de estados de loading e erro em toda a aplicação. O `QueryClient` centralizado em `src/lib/queryClient.ts` define um handler `onError` global para mutations não capturadas, enquanto hooks contextuais podem interceptar erros conhecidos e propagar o restante ao handler global.

O lock-in é moderado. A API do TanStack Query é similar à do SWR e do RTK Query, e uma eventual migração exigiria refactor dos hooks em `src/hooks/queries/` sem impacto nas páginas, desde que a interface dos hooks seja mantida estável. A centralização de `QueryKeys` em `keys.ts` reduz o risco de drift que tornaria essa migração mais custosa.

[NECESSITA ENTRADA: A estratégia de cache persistence entre sessões via TanStack Query Persist ainda não foi decidida - se e quando ativar `persistQueryClient` com `localStorage` como storage. Esta decisão afeta a experiência offline e o comportamento após reload.]

---

## 7. Referências

- `.claude/docs/FDD-service-layer.md:496` (QueryKeys factory e staleTime por domínio)
- `.claude/docs/FDD-service-layer.md:650` (QueryClient com onError global)
- `.claude/docs/HLD.md:279` (TanStack Query como estratégia de cache no HLD)
- `src/hooks/queries/keys.ts:1` (factory centralizado de QueryKeys)
- `src/lib/queryClient.ts:1` (configuração do QueryClient global)
