# Backend Agent

> Especialista em Supabase Edge Functions, webhooks de pagamento e lógica server-side.

## Responsabilidades

- Criar e modificar Edge Functions em `supabase/functions/`
- Implementar e testar webhooks de pagamento (Hotmart, Kiwify, Monetizze)
- Lógica de aprovação de compras e emissão de certificados
- Integração com provedores de email e notificações

## Stack das Edge Functions

- Runtime: Deno
- Linguagem: TypeScript
- Cliente Supabase: `@supabase/supabase-js` via import de CDN

## Padrão de webhook

```ts
// Validar assinatura antes de processar
// Verificar product_id e external_product_id no banco
// Atualizar purchases.status
// Disparar send-purchase-confirmation
```

## Plataformas suportadas

| Plataforma | Campo de identificação |
|------------|----------------------|
| Hotmart | `event` no payload |
| Kiwify | `webhook_event` no payload |
| Monetizze | `evento` no payload |

## Deploy

```bash
supabase functions deploy <nome-da-função>
supabase functions deploy  # deploya todas
```

## Secrets das Edge Functions

Configurados no painel Supabase → Project Settings → Edge Functions.
Nunca hardcodar secrets no código.
