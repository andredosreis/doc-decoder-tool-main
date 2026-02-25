# Melhorias e Roadmap

## Concluido (auditado em 2026-02-25)

### Seguranca
- [x] `webhook-payment`: validacao de assinatura via `timingSafeEqual` + `validateWebhookSignature` implementada — retorna 401 se WEBHOOK_SECRET ausente ou incorreto; validacao ocorre ANTES do JSON parse
- [x] `send-purchase-confirmation`: Bearer auth check contra `SUPABASE_SERVICE_ROLE_KEY` adicionado
- [x] Endpoint `reset-user-password` deletado (existia sem autenticacao — critico)
- [x] `ModuleView.tsx`: `dangerouslySetInnerHTML` sanitizado com `DOMPurify.sanitize()`
- [x] `ForgotPassword.tsx`: usa `supabase.auth.resetPasswordForEmail()` — fluxo seguro nativo

### Banco de Dados / Schema
- [x] `profiles` tem colunas `platform_name TEXT` e `support_email TEXT`
- [x] Trigger `handle_new_user`: AFTER INSERT ON auth.users, cria `profiles` + `user_roles`, SECURITY DEFINER + search_path fixo
- [x] RLS `modules`: `is_preview = TRUE OR (purchases.user_id = auth.uid() AND status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()))` — correto
- [x] RLS `products`: SELECT/UPDATE/DELETE restritos a `admin_id = auth.uid()` + alunos podem ver produtos ativos
- [x] RLS `purchases`: aluno ve so as suas; admin ve as dos seus produtos via EXISTS subquery
- [x] RLS `user_progress`: `ALL` restrito a `auth.uid() = user_id`
- [x] RLS `profiles`: SELECT e UPDATE restritos a `auth.uid() = id`
- [x] RLS `certificates`: usuario ve as suas; admin ve as dos seus produtos
- [x] Isolamento multi-tenant confirmado: nenhum vazamento cross-tenant detectado

### Tipos TypeScript
- [x] `src/integrations/supabase/types.ts`: profiles Row/Insert/Update tem `platform_name: string | null` e `support_email: string | null`

### Frontend
- [x] `Dashboard.tsx`: usa `useQuery` + `fetchDashboardStats()`, sem valores hardcoded — 4 cards reais + atividade recente
- [x] `Customers.tsx`: usa `useQuery` + `fetchCustomers()`, tabela real com nome/email/cursos/ultima compra
- [x] `Settings.tsx`: usa `useQuery` (load) + `useMutation` (save), salva `platform_name` e `support_email`
- [x] `App.tsx`: import `AdminWebhookSetup` presente; rota `path="webhooks"` dentro do bloco `/admin/*`
- [x] `AdminSidebar.tsx`: item `{ title: "Webhooks", url: "/admin/webhooks", icon: Webhook }` presente

### Qualidade de Codigo
- [x] `app.config.ts`: `baseUrl` usa `import.meta.env.VITE_APP_URL || window.location.origin` (sem hardcode)
- [x] `ModuleForm.tsx`: emoji `❌` removido do `console.error` (fix aplicado em 2026-02-25)
- [x] Console.logs de debug removidos de producao (sessao anterior)
- [x] Build limpo: 0 erros TypeScript, 0 type errors

---

## Pendente

### Checkout (Fase 2)
- [ ] Implementar integracao Stripe
- [ ] Implementar integracao Mercado Pago
- [ ] Implementar PIX nativo (Asaas ou Gerencianet)
- [ ] Reabilitar rotas comentadas em `App.tsx`: `/checkout`, `/thank-you`, `/payment-success`
- [ ] Implementar pagina de landing (`/landing`)

### Funcionalidades
- [ ] Dashboard de vendas com graficos (Recharts ja instalado — aguardando dados suficientes)
- [ ] Sistema de cupons de desconto
- [ ] Sistema de afiliados

### Operacional (nao-codigo)
- [ ] Configurar `WEBHOOK_SECRET` no Supabase Dashboard → Edge Functions → webhook-payment → Secrets
- [ ] Informar plataformas (Hotmart/Kiwify/Monetizze) para enviar `x-webhook-signature: <WEBHOOK_SECRET>`
- [ ] Deploy da funcao: `supabase functions deploy webhook-payment`

---

## Fase 3 (Futuro)

- [ ] Analytics avancado por produto
- [ ] Notificacoes WhatsApp
- [ ] Email marketing integrado
- [ ] Gamificacao (badges, pontos)
- [ ] Internacionalizacao (i18n)
- [ ] Split de pagamento para co-produtores
- [ ] Assinaturas recorrentes
- [ ] Recuperacao de carrinho abandonado
