# Arquitetura do Sistema

## Visão Geral

SaaS multi-tenant para cursos online. Cada admin possui seus produtos diretamente via `admin_id` — não existe tabela de organização/tenant separada.

## Fluxo de Autenticação

```
Usuário acessa /
  └─> Redireciona para /auth/admin-login ou /auth/student-login
        └─> Supabase Auth (email/password)
              └─> Trigger handle_new_user() cria profiles + user_roles
                    └─> ProtectedRoute verifica role em user_roles
                          ├─> role='admin' → /admin/dashboard
                          └─> role='user'  → /student
```

O signup em `/auth/signup` cria o usuário como `'user'` via trigger, depois o frontend faz um UPDATE para `'admin'` — fluxo de auto-registro de admin.

## Camadas da Aplicação

```
src/pages/          ← Páginas (lógica de negócio + queries)
src/components/     ← Componentes visuais reutilizáveis
src/hooks/          ← Lógica compartilhada (auth, roles, notificações)
src/integrations/   ← Cliente Supabase tipado (auto-gerado)
supabase/functions/ ← Edge Functions Deno (serverless)
```

## Banco de Dados

### Ownership e RLS

- `products.admin_id` → admin dono do curso
- `purchases.user_id` → aluno com acesso
- `modules` → acessível se `is_preview=true` OU compra aprovada e não expirada

### Relacionamentos chave

```
profiles (1) ──< user_roles (1)
profiles (1) ──< products (N)    [via admin_id]
products (1) ──< modules (N)
profiles (1) ──< purchases (N)
purchases (N) >── products (1)
modules (1) ──< user_progress (N)
products (1) ──< certificates (N)
```

### Ciclo de vida de uma compra

```
pending → approved → (cancelled | refunded)
```
Aprovação acontece via webhook das plataformas (Hotmart/Kiwify/Monetizze) processado pela Edge Function `webhook-payment`.

## Edge Functions

Todas em `supabase/functions/`, runtime Deno, deployadas no Supabase.

| Função | Trigger | Responsabilidade |
|--------|---------|-----------------|
| `webhook-payment` | HTTP POST externo | Recebe e valida webhooks de pagamento |
| `process-payment` | Interno | Atualiza status de purchase para approved |
| `create-checkout` | Frontend | Cria sessão de checkout |
| `send-purchase-confirmation` | Pós-aprovação | Envia email de confirmação |
| `send-notification` | Interno | Cria notificação in-app |
| `generate-certificate` | Conclusão do curso | Gera PDF do certificado |
| `reset-user-password` | Auth | Reset customizado de senha |

## Estado e Cache

TanStack Query v5 gerencia todo cache de dados. Padrão de uso:

```ts
// Leitura
const { data } = useQuery({ queryKey: ['products'], queryFn: () => supabase.from('products').select('*') })

// Mutação
const mutation = useMutation({ mutationFn: ..., onSuccess: () => queryClient.invalidateQueries(...) })
```

## Storage

Dois buckets públicos no Supabase Storage:
- `product-images` — thumbnails e logos de produtos
- `module-content` — vídeos, PDFs e outros arquivos de módulos
