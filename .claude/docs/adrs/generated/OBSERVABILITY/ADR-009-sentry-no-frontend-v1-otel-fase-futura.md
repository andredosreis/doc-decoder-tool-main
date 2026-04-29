# ADR-009: Sentry no frontend desde v1.0; OpenTelemetry como fase futura

**Status:** Aceito
**Data:** 26-04-2026

**ADRs Relacionadas:**
- [ADR-007: TanStack Query como cache exclusiva de dados de servidor no frontend](../FRONTEND/ADR-007-tanstack-query-cache-servidor.md)
- [ADR-008: ServiceLayer obrigatorio entre paginas React e Supabase JS Client](../FRONTEND/ADR-008-service-layer-obrigatorio.md)

---

## Contexto e Declaração do Problema

A plataforma APP XPRO v1.0 necessita de capacidade de diagnóstico de erros em produção no frontend. Sem observabilidade externa, incidentes causados por erros nao capturados no React, falhas em chamadas ao Supabase ou exceptions globais ficam invisíveis, aumentando o tempo médio de diagnóstico e degradando a qualidade do produto.

A alternativa de tracing distribuído completo via OpenTelemetry foi avaliada para v1.0. No entanto, a ausência de um backend de tracing escolhido (Honeycomb, Tempo ou Jaeger) tornaria a instrumentação uma dívida sem retorno operacional: exportar dados sem destino configurado não contribui para a capacidade de diagnóstico. O custo de configurar e manter um backend de tracing próprio é desproporcional ao volume de incidentes esperado em fase pre-revenue.

A estratégia adotada é iniciar com cobertura imediata via Sentry SDK no frontend e definir um critério mensurável de ativação para OpenTelemetry, evitando over-engineering na fase inicial enquanto preserva o caminho de evolução para tracing distribuído.

## Drivers de Decisão

- Capacidade de diagnóstico de erros em produção é necessária desde o primeiro utilizador real
- Sentry oferece ROI imediato (stack traces, breadcrumbs, contexto de utilizador) com baixa complexidade de adoção
- OpenTelemetry exige backend de tracing dedicado cuja escolha esta pendente (Honeycomb vs Tempo vs Jaeger)
- Correlação cross-service é parcialmente mitigada em v1.0 via `X-Request-Id` propagado em logs estruturados das Edge Functions
- Custo do Sentry é modesto e compatível com fase pre-revenue; Datadog APM foi rejeitado por custo significativamente superior
- Critério de ativacao para OpenTelemetry deve ser mensuravel para evitar postergação indefinida

## Opcoes Consideradas

1. Sentry SDK no frontend (v1.0) com OpenTelemetry como fase futura
2. OpenTelemetry desde v1.0 com backend de tracing a escolher
3. Datadog APM como solução unificada de observabilidade

## Decisao

Opcao escolhida: **Sentry SDK no frontend desde v1.0**, porque entrega diagnóstico de erros imediato com complexidade mínima e custo modesto, enquanto OpenTelemetry e tracing distribuído ficam reservados para fase 2 com critério de ativacao mensuravel: tempo médio de diagnóstico de incidente superior a 30 minutos.

Sample rate inicial: `tracesSampleRate: 0.1` (10%). Regras de filtragem de PII: `sendDefaultPii: false` no `Sentry.init`; `beforeSend` aplica scrubbing de campos `email`, `full_name`, `cpf`, `cnpj`, `password`, tokens e signed URLs em qualquer evento ou breadcrumb. Configuração documentada em `src/main.tsx` aquando da introdução do SDK.

## Prós e Contras das Opcoes

### Sentry SDK no frontend (v1.0) com OpenTelemetry como fase futura

- Positivo: cobertura de erros imediata sem dependência de backend de tracing
- Positivo: SDK de adoção conhecida pelo time; curva de aprendizado baixa
- Positivo: breadcrumbs e stack traces com contexto de utilizador disponíveis desde o boot da aplicação
- Negativo: correlação entre frontend e Edge Functions é manual em v1.0 (apenas via `X-Request-Id` em logs)

### OpenTelemetry desde v1.0

- Positivo: tracing distribuído end-to-end desde o início
- Negativo: exige backend de tracing dedicado (decisão de Honeycomb vs Tempo vs Jaeger ainda pendente)
- Negativo: complexidade alta de instrumentação (exportadores, propagators, samplers) desproporcional ao estágio do produto
- Negativo: instrumentação sem backend configurado exporta dados para o vacuo sem valor operacional

### Datadog APM

- Positivo: plataforma unificada de métricas, logs e tracing
- Negativo: custo significativamente superior em fase pre-revenue; rejeitado por criterio economico
- Negativo: lock-in de vendor mais elevado do que as alternativas avaliadas

Política de breadcrumbs: capturar mudanças de rota do React Router (já default do SDK Sentry); **não** capturar queries TanStack como breadcrumbs por gerarem ruído com baixo valor de diagnóstico. Manter breadcrumbs default de fetch para registar chamadas a Supabase.

## Consequencias

Sentry SDK inicializado em `src/main.tsx` antes da montagem do componente raiz garante cobertura desde o boot da aplicação. Erros nao capturados no React via ErrorBoundary integration, falhas em fetch para o Supabase e exceptions globais ficam visíveis no dashboard do Sentry com stack trace e contexto de utilizador. Esta decisao mitiga parcialmente o Risco 9 do HLD ("Logs sem correlação cross-service inviabilizam diagnóstico"), embora a correlação entre frontend e Edge Functions permaneça manual em v1.0 via `X-Request-Id`.

A decisao de backend de tracing (Honeycomb, Tempo ou Jaeger) permanece como dívida explícita registada no HLD. Um ADR sucessor documentará essa transição quando o critério de ativacao for atingido. A escolha do backend de tracing influenciará a estratégia de instrumentação OpenTelemetry, os custos operacionais recorrentes e o nível de vendor lock-in na camada de observabilidade.

[NECESSITA INFORMACAO: O backend de tracing para a fase OpenTelemetry foi decidido? HLD lista Honeycomb, Tempo e Jaeger como candidatos sem decisao registada.]

## Referencias

- `.claude/docs/HLD.md` (seção Observabilidade, Riscos arquiteturais Risco 9, ADRs e próximos passos item 7)
- `src/main.tsx:1` (ponto de inicialização do Sentry SDK)
- `package.json:1` (dependência `@sentry/react` a adicionar)
