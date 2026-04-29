# ADR-011: Resend como provider de e-mail transacional em v1.0

**Status:** Aceito
**Data:** 26-04-2026

**Depende de:** [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)

**ADRs Relacionadas:**
- [ADR-004: Promoção de Role Admin via SQL SECURITY DEFINER e Edge Function](../AUTH/ADR-004-promocao-role-admin-security-definer.md)
- [ADR-010: Sem versionamento de URL nas Edge Functions; breaking change via sufixo -v2](../API/ADR-010-sem-versionamento-url-edge-functions-sufixo-v2.md)

---

## 1. Contexto e Problema

O APP XPRO depende de e-mails transacionais em momentos críticos da jornada do utilizador: confirmação de compra após aprovação de webhook, convite de aluno com link de configuração de senha, notificação de certificado disponível e recuperação de senha integrada ao Supabase Auth. Esses disparos ocorrem exclusivamente a partir de Edge Functions Deno, portanto o provider precisa de SDK compatível com o runtime Deno.

Em v1.0 a plataforma opera em volume baixo (estimativa abaixo de 3 000 e-mails/mês na fase inicial). O critério de reavaliação definido no HLD é 10 000 e-mails/mês, ponto em que a comparação de pricing com alternativas passa a ser economicamente relevante. Acima desse threshold, providers como AWS SES oferecem custo por mensagem significativamente menor.

Os templates são HTML inline com branding mínimo (logo e cor de tema). Não há template engine externa em v1.0; a complexidade visual atual não justifica a introdução de uma camada adicional.

## 2. Fatores de Decisão

- Compatibilidade nativa com Deno runtime das Edge Functions Supabase, sem wrappers adicionais
- Developer experience no onboarding e na iteração de templates, dado o volume inicial baixo
- Deliverability para e-mails de confirmação de compra, que são críticos para a UX do aluno
- Free tier suficiente para a fase inicial sem custo adicional ao plano Supabase
- Isolamento do vendor de e-mail em relação ao resto da stack (mudança futura não exige refactor de negócio)
- [NECESSITA INFORMAÇÃO: Existe SLA contratual formal com o Resend para o plano utilizado, além dos 99,9% declarados na página pública? Confirmar antes de definir SLO de entrega de e-mail em produção.]

## 3. Opções Consideradas

- **Opção A:** Resend como provider único com SDK nativo Deno
- **Opção B:** Supabase native templates + AWS SES como SMTP customizado
- **Opção C:** Postmark com integração via HTTP REST

## 4. Decisão

Escolhida a Opção A (Resend), porque oferece SDK com suporte explícito a Deno, free tier de 3 000 e-mails/mês adequado à fase inicial, e developer experience superior para iteração de templates HTML inline. O isolamento do provider nas Edge Functions garante que uma migração futura exige apenas refactor das funções `send-purchase-confirmation` e `send-notification`, sem impacto em regras de negócio.

O critério de reavaliação é objetivo e mensurável: quando o volume mensal ultrapassar 10 000 e-mails, a comparação de pricing com AWS SES e SendGrid justifica a análise formal.

## 5. Prós e Contras das Opções

### Opção A: Resend

- Bom: SDK nativo Deno elimina a necessidade de wrappers HTTP manuais
- Bom: Free tier cobre o volume esperado de v1.0 sem custo adicional
- Bom: Iteração de templates direta via dashboard Resend com pré-visualização
- Ruim: Vendor único sem failover para SMTP secundário em v1.0; falha do Resend impacta todos os e-mails transacionais
- Ruim: [NECESSITA INFORMAÇÃO: Comportamento de retry em falha transitória do Resend está documentado? Confirmar se o SDK realiza retentativas automáticas ou se é necessário implementar backoff nas Edge Functions.]

### Opção B: Supabase native templates + AWS SES SMTP

- Bom: Reduz dependência de vendor externo adicional ao ecossistema já contratado
- Ruim: Templates nativos do Supabase têm flexibilidade limitada para customização de branding
- Ruim: Configuração SMTP adicional nas Edge Functions aumenta complexidade operacional sem ganho em v1.0

### Opção C: Postmark

- Bom: Provider mais maduro com histórico de deliverability documentado
- Ruim: Pricing em volume baixo é desfavorável comparado ao free tier do Resend
- Ruim: Sem diferencial técnico relevante para os casos de uso de v1.0

## 6. Consequências

O provider de e-mail fica encapsulado nas Edge Functions `send-purchase-confirmation`, `send-notification` e `admin-invite-student`, com um módulo compartilhado de inicialização do cliente Resend. Essa fronteira garante que uma migração futura para AWS SES, Postmark ou SendGrid exige apenas refactor nessas funções, sem propagação para a lógica de negócio.

A ausência de failover para SMTP secundário é uma limitação aceita em v1.0. Incidentes prolongados do Resend impactarão a entrega de confirmações de compra, convites e notificações de certificado. O mitigante operacional é o log estruturado com `purchase_id` e `user_email` nas Edge Functions, que permite reenvio manual enquanto o incidente não é resolvido.

O threshold de 10 000 e-mails/mês como critério de reavaliação deve ser monitorado via métrica de throughput de e-mail (disponível no dashboard do Resend e via SLO de entrega >= 99% definido no HLD). Quando atingido, iniciar análise comparativa de pricing com AWS SES.

## 7. Referências

- `supabase/functions/send-purchase-confirmation/index.ts:1`
- `supabase/functions/send-notification/index.ts:1`
- `supabase/functions/admin-invite-student/index.ts:1`
- `supabase/functions/_shared/resend.ts:1`
