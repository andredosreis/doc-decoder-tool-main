# Melhorias e Roadmap

## Pendentes / Em andamento

### Banco de Dados
- [ ] Investigar e resolver problemas de RLS/triggers em produção
- [ ] Verificar se trigger `handle_new_user` está ativo e funcionando corretamente
- [ ] Validar policies de SELECT em `modules` para alunos com compra aprovada

### Checkout (Fase 2)
- [ ] Implementar integração Stripe
- [ ] Implementar integração Mercado Pago
- [ ] Implementar PIX nativo (Asaas ou Gerencianet)
- [ ] Reabilitar rotas comentadas em `App.tsx`: `/checkout`, `/thank-you`, `/payment-success`
- [ ] Implementar página de landing (`/landing`)

### Funcionalidades
- [ ] Dashboard de vendas com gráficos (Recharts já instalado)
- [ ] Sistema de cupons de desconto
- [ ] Sistema de afiliados
- [ ] Assinaturas recorrentes
- [ ] Recuperação de carrinho abandonado

## Débito Técnico

- `src/integrations/supabase/types.ts` precisa ser regenerado após mudanças no schema
- Rotas de checkout (`Checkout.tsx`, `ThankYou.tsx`, `PaymentSuccess.tsx`) existem mas estão inacessíveis
- Página `Index.tsx` (landing) existe mas a rota está comentada
- `WebhookSetup.tsx` em `src/pages/admin/` — verificar se está acessível via rota

## Fase 3 (Futuro)

- [ ] Analytics avançado por produto
- [ ] Notificações WhatsApp
- [ ] Email marketing integrado
- [ ] Gamificação (badges, pontos)
- [ ] Internacionalização (i18n)
- [ ] Split de pagamento para co-produtores
