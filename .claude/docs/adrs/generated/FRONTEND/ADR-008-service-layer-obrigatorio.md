# ADR-008: ServiceLayer obrigatorio entre paginas React e Supabase JS Client

**Status:** Aceito
**Data:** 26-04-2026

**Depende de:** [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)

**Usado por:**
- [ADR-006: URLs Assinadas para Conteúdo de Storage Privado](../STORAGE/ADR-006-urls-assinadas-buckets-privados.md)
- [ADR-007: TanStack Query como cache exclusiva de dados de servidor no frontend](./ADR-007-tanstack-query-cache-servidor.md)

**ADRs Relacionadas:** [ADR-009: Sentry no frontend desde v1.0; OpenTelemetry como fase futura](../OBSERVABILITY/ADR-009-sentry-no-frontend-v1-otel-fase-futura.md)

---

## 1. Contexto e Problema

A v1.0 da plataforma APP XPRO possui 18 paginas React que chamam o cliente Supabase directamente dentro dos componentes de UI. Esta ausencia de separacao entre acesso a dados e logica de apresentacao mistura responsabilidades distintas, gera tratamento de erros inconsistente entre paginas e impossibilita a reutilizacao de logica de acesso a dados. O problema e identificado como Problema 5 no HLD: "logica de negocio misturada nas paginas React sem camada de servico isolada; dificulta testes e manutencao".

A ausencia de uma fronteira formal entre a camada de UI e o provider de dados tambem agrava o Risco 1 do HLD (dependencia total do Supabase como provider unico): sem uma camada de servico intermediaria, uma eventual migracao de provider exigiria refactor de todas as 18 paginas individualmente, em vez de mudancas concentradas em um conjunto delimitado de modulos.

A decisao de introducir o ServiceLayer foi formalizada no FDD-003 em 26-04-2026, com estrategia de adocao incremental por PRs de dominio. Durante a migracao (PRs 0 a 5) a regra e aplicada progressivamente; apos o merge do PR 6 (notificacoes), a restricao "sem chamadas directas ao Supabase fora de `src/services/`" entra em vigor para todo o codebase.

---

## 2. Condutores de Decisao

- Testabilidade: queries Supabase directas em componentes tornam testes unitarios de logica de UI inpraticaveis sem mock do SDK completo.
- Consistencia no tratamento de erros: cada pagina implementa (ou omite) tratamento de erro de forma independente, gerando experiencia de usuario inconsistente.
- Portabilidade de provider: o Risco 1 do HLD aponta que substituir o Supabase sem uma camada intermediaria implicaria refactor de escopo indefinido no frontend.
- Reutilizacao entre paginas: multiplas paginas que acessam o mesmo dominio de dados duplicam logica identica de query.
- Convencao previsivel: novos dominios devem seguir um padrao estabelecido sem ambiguidade sobre onde a logica de acesso a dados reside.

---

## 3. Opcoes Consideradas

1. **ServiceLayer por dominio com objeto literal** -- modulos em `src/services/<dominio>.service.ts` exportados como constantes; cliente Supabase importado directamente em cada servico.
2. **Hooks chamando Supabase directamente** -- estado actual em producao; cada hook de UI gerencia sua propria query ao cliente Supabase sem intermediario.
3. **Repository pattern com classes e injecao de dependencias** -- servicos implementados como classes injectaveis, permitindo substituicao do cliente em testes unitarios.

---

## 4. Decisao

Opcao escolhida: **ServiceLayer por dominio com objeto literal**, porque elimina a mistura de UI com data access com o menor overhead de implementacao para o tamanho e maturidade da v1.0. O objeto literal e tree-shakeable, alinha com o estilo existente no codebase TypeScript e nao exige infraestrutura de injecao de dependencias que nao traz beneficio real ate que testes unitarios com mock do cliente sejam priorizados.

A fronteira e clara: paginas e hooks TanStack Query consomem exclusivamente os servicos de dominio; os servicos de dominio sao os unicos modulos autorizados a importar o cliente Supabase, o helper de Edge Functions (`src/services/_edge.ts`) e o servico de Storage (`src/services/storage.service.ts`).

[NECESSITA INPUT: Qual ferramenta de lint sera usada para enforcar a restricao de importacao -- ESLint custom rule, `eslint-plugin-import` com `no-restricted-imports`, ou outro mecanismo? A decisao impacta o setup do PR 0 (fundacoes).]

---

## 5. Pros e Contras das Opcoes

### ServiceLayer por dominio com objeto literal

- Positivo: fronteira clara entre UI e data access sem overhead de injecao de dependencias.
- Positivo: tratamento de erros centralizado por dominio; comportamento consistente entre paginas.
- Positivo: migracao de provider futura limitada ao ServiceLayer e Edge Functions, sem tocar nas paginas.
- Negativo: adiciona uma camada de indirecao que pode parecer cerimonial para queries simples.

### Hooks chamando Supabase directamente (estado actual)

- Positivo: zero fricao para adicionar novas queries -- qualquer componente acessa o SDK diretamente.
- Negativo: tratamento de erros e comportamento de loading implementados de forma inconsistente por pagina.
- Negativo: migracao de provider requer refactor distribuido em todas as paginas sem ponto central de mudanca.
- Negativo: reutilizacao de logica de query exige copia-cola ou extracao manual caso a caso.

### Repository pattern com classes e injecao de dependencias

- Positivo: permite substituicao do cliente Supabase por um mock em testes unitarios sem alteracao do codigo de producao.
- Negativo: overhead de implementacao (interfaces, conteineres de DI ou parametros de funcao) desproporcional para v1.0.
- Negativo: nenhum mecanismo de DI esta configurado no projeto; introduzi-lo aumentaria a complexidade de setup.

---

## 6. Consequencias

A adopcao do ServiceLayer requer a criacao dos modulos de servico por dominio antes de refatorar as paginas correspondentes. O FDD-003 define uma sequencia de PRs incrementais (PR 0 fundacoes, PRs 1 a 6 por dominio) que permite migracao sem regressoes: paginas ainda nao migradas podem continuar usando Supabase directamente durante a transicao, com a restricao completa activada apos PR 6.

A fronteira introduzida protege a portabilidade da camada de UI: se o Supabase for substituido por outro provider no futuro, o escopo de mudanca fica restrito aos arquivos em `src/services/`, ao helper `src/services/_edge.ts` e aos ficheiros de configuracao do cliente, sem tocar nas paginas, nos hooks TanStack Query nem nos componentes de UI. Esta separacao esta directamente alinhada com a matriz de portabilidade descrita no HLD.

[NECESSITA INPUT: Apos o merge do PR 6, quando a restricao de importacao entrar em vigor, sera aplicada como bloqueio de CI (build falha) ou apenas como warning de lint? A severidade afecta o fluxo de trabalho do time durante o periodo de transicao.]

---

## 7. Referencias

- `.claude/docs/FDD-service-layer.md:1` -- FDD-003 com estrutura completa de ficheiros, padrao de retorno, QueryKeys factory e plano de migracao incremental por PRs.
- `.claude/docs/HLD.md:96` -- Padrao ServiceLayer listado em "Padroes adotados"; Risco 1 (dependencia Supabase) e Problema 5 (logica misturada nas paginas).
- `src/services/products.service.ts:1` -- Modulo de servico de referencia a criar no PR 2.
- `src/types/domain.ts:1` -- Ponto unico de importacao de tipos de entidade nas paginas; criado no PR 0.
- `src/lib/supabase-errors.ts:1` -- Helper de identificacao de erros Supabase por codigo; criado no PR 0.
