# Potential ADR: Resend como provider de e-mail transacional em v1.0

**Module:** EMAIL
**Category:** Vendor
**Priority:** must-document
**Score:** 100/150

---

## What Was Identified

Resend é o provider único de e-mails transacionais em v1.0: confirmação de compra, convite de aluno (com link de recovery), recovery de password (Supabase Auth integration), notificação de certificado disponível. SDK do Resend chamado via Edge Functions (`send-purchase-confirmation`, `send-notification`).

Templates simples em HTML inline; sem template engine externo. Branding mínimo (logo, theme color).

Critério de revisão: volume mensal > 10 000 e-mails (threshold de avaliação para alternativas com pricing diferente).

Introduced: 2026-04-26 (HLD baseline)

## Why This Might Deserve an ADR

**Impact:** Comunicação com aluno (UX crítica: aluno espera confirmação após pagamento) e com admin.

**Trade-offs:** Setup simples + boa deliverability + DX agradável vs vendor único; SLA contratual 99.9% mas sem failover entre providers em v1.0; lock-in pontual nesta capability.

**Complexity:** Baixa.

**Team Knowledge:** Familiar com APIs de e-mail.

**Future Implications:** Migração futura para AWS SES, Postmark ou SendGrid exigiria refactor dos wrappers em Edge Functions. Se templates evoluírem para complexidade significativa, considerar template engine separado (Maizzle, MJML) independente do provider.

## Evidence Found in Codebase

**Key Files:**
- supabase/functions/send-purchase-confirmation/index.ts:1
- supabase/functions/send-notification/index.ts:1
- supabase/functions/admin-invite-student/index.ts:1
- supabase/functions/_shared/resend.ts:1

**Impact Analysis:**
Aplicado a todos os e-mails transacionais. Auth recovery passa por Supabase Auth (não Resend directamente) mas pode ser configurado para usar Resend como SMTP custom. Introduced: 2026-04-26.

**Alternative Not Chosen:**
Supabase native templates + AWS SES como SMTP. Rejeitada por menor flexibilidade de templates e UI menos boa para iterar. Considerou-se também Postmark (similar ao Resend, mais maduro mas mais caro em volume baixo) e SendGrid (overkill para v1.0). Resend tem free tier generoso (3000 e-mails/mês) e DX claramente superior aos concorrentes nessa fase.

## Questions to Address in ADR

- Política de retentativas em caso de falha do Resend (ex: 3 tentativas com backoff exponencial)?
- Critério de revisão por volume — exatamente o que medir e quando?
- Failover para SMTP backup (SES) em incidente prolongado do Resend?

## Additional Notes

ADR-011 do HLD lista threshold de revisão "10k e-mails/mês" como critério mensurável. Templates HTML inline em v1.0; engine separado fica como alvo v2.0 quando complexidade visual justificar.
