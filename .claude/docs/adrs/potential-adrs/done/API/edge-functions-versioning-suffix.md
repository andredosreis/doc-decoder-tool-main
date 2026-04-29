# Potential ADR: Sem versionamento de URL nas Edge Functions; breaking change via sufixo -v2

**Module:** API
**Category:** API Strategy
**Priority:** must-document
**Score:** 105/150

---

## What Was Identified

Edge Functions são chamadas via path padrão do Supabase (`/functions/v1/<name>`). O segmento `/v1/` pertence ao schema do Supabase, não da nossa aplicação; não é versionamento aplicacional. v1.0 não introduz versionamento nas URLs (sem `/v1/<name>`, `/v2/<name>` aplicacional).

Estratégia para breaking changes em interface pública: criar nova função com sufixo `-v2` no nome (ex: `webhook-payment` evolui para `webhook-payment-v2`). Original permanece deployada até todas as plataformas externas migrarem; depois é removida. Interfaces internas (chamadas entre Edge Functions, ex: `process-payment`, `send-notification`) nunca são versionadas — refactoradas in-place.

Introduced: 2026-04-26 (HLD baseline)

## Why This Might Deserve an ADR

**Impact:** Estratégia de evolução de API. Define como e quando podemos quebrar contractos sem partir consumidores externos.

**Trade-offs:** Simplicidade (sem URL versioning aplicacional, sem framework de versioning) + permite migração gradual de consumidores externos vs duplicação de código durante períodos de transição (duas funções activas simultaneamente).

**Complexity:** Baixa.

**Team Knowledge:** Padrão pragmático.

**Future Implications:** Limpeza de funções obsoletas (`-v1`) exige tracking explícito; sem mecanismo automático de deprecation. Documentar deprecation timeline por função no momento da introdução de `-v2`.

## Evidence Found in Codebase

**Key Files:**
- supabase/functions/webhook-payment/index.ts:1
- supabase/functions/process-payment/index.ts:1 (interna, não versionada)
- supabase/functions/send-notification/index.ts:1
- supabase/functions/generate-certificate/index.ts:1

**Impact Analysis:**
Aplicado a todas as 10+ Edge Functions actualmente deployadas. Webhook-payment recebe Hotmart, Kiwify, Monetizze, Stripe — múltiplos consumidores externos. Quebrar contract sem versioning afecta integração paga. Introduced: 2026-04-26.

**Alternative Not Chosen:**
URL versioning aplicacional explícito (`/v1/webhook-payment`, `/v2/webhook-payment`). Rejeitada por adicionar complexidade (rewrite rules ou nested routing) sem ROI claro: o sufixo no nome da função tem o mesmo efeito prático com menos cerimónia. Considerou-se também header-based versioning (`Accept-Version`); rejeitada por consumidores externos (plataformas de pagamento) raramente customizarem headers.

## Questions to Address in ADR

- Política de deprecation timeline para funções `-v1` (ex: 90 dias após `-v2` deployed)?
- Métricas de adopção `-v2` (logs com versão chamada para confirmar transição completa)?
- Como comunicar deprecation a consumidores externos (e-mail, dashboard)?

## Additional Notes

ADR-010 do HLD lista esta política. Aplica-se apenas a interfaces públicas (chamadas por consumidores externos ou frontend); interfaces internas chamadas por outras Edge Functions são refactoradas livremente.
