# Potential ADR: Sentry no frontend desde v1.0; OpenTelemetry como fase futura

**Module:** OBSERVABILITY
**Category:** Operations
**Priority:** must-document
**Score:** 105/150

---

## What Was Identified

Sentry SDK no frontend é a única ferramenta de observabilidade externa adoptada em v1.0. Captura erros não capturados em React (via ErrorBoundary integration), erros de chamadas a Supabase via fetch, e exceptions globais. Inicializado em `src/main.tsx` antes do `<App />` para garantir cobertura desde o boot.

OpenTelemetry e tracing distribuído são deliberadamente rejeitados para v1.0 como over-engineering: sem backend de tracing configurado (Honeycomb, Tempo, Jaeger), instrumentar exporta dados para o vácuo. Critério de activação para fase 2: tempo médio de diagnóstico de incidente > 30 minutos.

Em v1.0, correlação entre Edge Functions é manual via `X-Request-Id` UUID propagado em logs estruturados.

Introduced: 2026-04-26 (HLD baseline)

## Why This Might Deserve an ADR

**Impact:** Capacidade de diagnóstico de incidentes em produção.

**Trade-offs:** Sentry tem ROI imediato (stack traces user, breadcrumbs, performance básica) + custo modesto vs OpenTelemetry exige backend dedicado (decisão pendente entre Honeycomb/Tempo/Jaeger) + esforço de instrumentação distribuído.

**Complexity:** Sentry baixa (SDK init, opcional source maps no build). OpenTelemetry alta (exportadores, propagators, samplers, backend).

**Team Knowledge:** Sentry conhecido; OpenTelemetry novidade no team.

**Future Implications:** Quando volume de incidentes ou complexidade justificar (critério > 30 min de diagnóstico), fase 2 introduz tracing distribuído. ADR sucessor irá documentar essa transição.

## Evidence Found in Codebase

**Key Files:**
- src/main.tsx:1 (Sentry.init a adicionar)
- package.json:1 (@sentry/react a adicionar)
- (sem ficheiros de OpenTelemetry em v1.0)

**Impact Analysis:**
Em v1.0 confiamos em Sentry para frontend errors + console logs estruturados das Edge Functions com `X-Request-Id`. Mitigação parcial do Risco 9 do HLD ("Logs sem correlação cross-service inviabilizam diagnóstico"). Introduced: 2026-04-26 como decisão da fase de planeamento.

**Alternative Not Chosen:**
OpenTelemetry desde v1.0. Rejeitada por custo/complexidade desproporcional sem backend de tracing escolhido; instrumentação sem destino é dívida sem ROI. Considerou-se também Datadog APM; rejeitada por custo significativamente superior em fase pre-revenue.

## Questions to Address in ADR

- Backend de tracing quando OpenTelemetry for activado? (decisão pendente listada no HLD: Honeycomb vs Tempo vs Jaeger)
- Sample rate inicial do Sentry para tracing performance? PII filtering rules?
- Política de breadcrumbs (incluir route changes, queries TanStack)?

## Additional Notes

ADR-009 do HLD posiciona Sentry como "única ferramenta de observabilidade externa adoptada agora". Critério de activação OpenTelemetry mensurável: tempo médio diagnóstico > 30 min. Decisão pendente de backend tracing fica registada como dívida explícita no HLD.
