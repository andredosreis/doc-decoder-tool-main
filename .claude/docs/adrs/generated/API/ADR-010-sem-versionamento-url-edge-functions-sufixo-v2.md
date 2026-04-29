# ADR-010: Sem versionamento de URL nas Edge Functions; breaking change via sufixo -v2

**Status:** Aceito
**Data:** 26-04-2026

**Depende de:** [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)

**ADRs Relacionadas:**
- [ADR-005: Idempotência de Webhook por UNIQUE(external_transaction_id)](../BILLING/ADR-005-idempotencia-webhook-unique-constraint.md)
- [ADR-011: Resend como provider de e-mail transacional em v1.0](../EMAIL/ADR-011-resend-como-provider-de-email-transacional.md)

---

## 1. Contexto e Problema

A plataforma APP XPRO expoe Edge Functions Deno via o schema de URL nativo do Supabase (`/functions/v1/<nome>`). O segmento `/v1/` pertence ao roteamento interno do Supabase e nao representa versionamento aplicacional. A decisao central e como evoluir interfaces publicas das Edge Functions quando mudancas incompativeis forem necessarias.

A funcao `webhook-payment` recebe eventos de multiplas plataformas externas de pagamento (Hotmart, Kiwify, Monetizze, Eduzz). Cada uma dessas plataformas configura uma URL de destino nos seus sistemas, sem mecanismo automatico de atualizacao. Qualquer mudanca incompativel no contrato da funcao pode interromper o fluxo de aprovacao de compras em producao.

Interfaces internas entre Edge Functions (ex.: `process-payment`, `send-notification`) sao chamadas apenas pelo proprio codigo da plataforma e podem ser refatoradas livremente sem impacto externo.

## 2. Fatores de Decisao

- Breaking changes em interfaces publicas podem interromper receita ao bloquear aprovacao de compras via webhook
- Plataformas externas de pagamento raramente permitem customizacao de headers HTTP, tornando header-based versioning impratico
- A complexidade operacional deve ser minima: o time e pequeno e a stack ja impoe restricoes de runtime (Supabase Deno Edge)
- A estrategia de versionamento precisa permitir migracao gradual de consumidores externos sem janela de manutencao
- O custo de manter duas funcoes simultaneamente deve ser menor que o risco de breaking change sem periodo de transicao

## 3. Opcoes Consideradas

- **Sufixo `-v2` no nome da funcao** (escolhida): criar nova funcao com sufixo no nome quando houver breaking change em interface publica; manter a versao original ate todos os consumidores migrarem
- **URL versioning aplicacional** (`/v1/webhook-payment`, `/v2/webhook-payment`): adicionar prefixo de versao na rota, exigindo rewrite rules ou roteamento aninhado no gateway
- **Header-based versioning** (`Accept-Version`): consumidor envia header indicando a versao desejada; a funcao despacha para o handler correto

## 4. Decisao

Opcao escolhida: **sufixo `-v2` no nome da funcao**, porque permite migracao gradual de consumidores externos com o mesmo efeito pratico do URL versioning, porem com menor cerimonia tecnica. Nao requer rewrite rules, gateway ou logica de despacho adicional no runtime Deno do Supabase.

A regra e simples: interfaces publicas recebem nova funcao com sufixo; a original permanece deployada em paralelo ate a transicao estar completa e entao e removida. Interfaces internas — aquelas chamadas apenas por outras Edge Functions — sao refatoradas in-place sem criar nova versao.

Política de prazo de deprecação: **híbrida**. Mínimo de 60 dias após deploy da `-v2`. Remoção da `-v1` permitida após 14 dias consecutivos com zero chamadas (validado via logs estruturados). Cap máximo de 180 dias mesmo com chamadas remanescentes a `-v1`, accionando comunicação directa aos consumidores para forçar migração.

## 5. Prós e Contras das Opcoes

### Sufixo `-v2` no nome da funcao (escolhida)

- Positivo: zero complexidade adicional de infraestrutura; funciona com o roteamento nativo do Supabase
- Positivo: URL da nova versao e autodescritiva e pode ser comunicada diretamente as plataformas externas
- Positivo: rollback e trivial — a funcao original continua deployada durante a transicao
- Negativo: duplicacao de codigo entre a funcao original e a `-v2` durante o periodo de coexistencia; requer limpeza explicita apos migracao

### URL versioning aplicacional

- Positivo: padrao amplamente reconhecido em APIs REST; familiar para equipes externas
- Positivo: permite multiplas versoes na mesma funcao via despacho interno
- Negativo: o Supabase nao suporta roteamento aninhado nativo; exigiria solucao de contorno no entrypoint da funcao ou configuracao de gateway externo
- Negativo: maior complexidade sem ganho real para o volume atual de funcoes publicas

### Header-based versioning

- Positivo: URL permanece estavел; a versao e negociada no protocolo HTTP
- Negativo: plataformas de pagamento externas (Hotmart, Kiwify, Monetizze) nao oferecem customizacao de headers nas configuracoes de webhook; inviavel na pratica
- Negativo: aumenta a complexidade de debug: a versao efetiva nao e visivel na URL dos logs

## 6. Consequencias

A adocao desta estrategia significa que cada breaking change em interface publica gera um novo artefato deployado no Supabase. O catalogo de funcoes cresce temporariamente durante periodos de transicao. E necessario rastrear explicitamente quais funcoes estao em estado "deprecated aguardando migracao" para evitar acumulo.

O periodo de coexistencia entre a funcao original e a `-v2` cria risco de divergencia de comportamento se correcoes de bugs forem aplicadas apenas em uma das versoes. O processo de deploy deve garantir que patches criticos sejam aplicados em ambas durante a transicao.

Monitorização da adopção: logs estruturados das Edge Functions emitem campo `function_version` (`v1` ou `v2`) por chamada recebida. Suficiente para v1.0; agregação ad-hoc via query SQL nos logs Supabase. Dashboard dedicado fica como evolução v1.x se a frequência de versioning crescer.

Comunicação de deprecação: **dual**. (a) e-mail directo aos admins que configuraram a URL no painel de cada plataforma (Hotmart, Kiwify, Monetizze, Eduzz); (b) banner permanente no painel admin do APP XPRO 30 dias antes da remoção. As plataformas de pagamento não podem ser notificadas directamente: o admin é o intermediário operacional.

## 7. Referencias

- `supabase/functions/webhook-payment/index.ts:1`
- `supabase/functions/process-payment/index.ts:1`
- `supabase/functions/send-notification/index.ts:1`
- `.claude/docs/HLD.md:260` (politica de versionamento de Edge Functions)
