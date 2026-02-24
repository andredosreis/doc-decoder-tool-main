# Plataforma de Cursos Online — SaaS Multi-tenant

Plataforma completa para criação e gestão de cursos online. Admins criam produtos e módulos; alunos consomem o conteúdo após compra.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **Estado**: TanStack Query v5
- **Roteamento**: React Router v6
- **Formulários**: React Hook Form + Zod

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do Supabase

# 3. Iniciar dev server
npm run dev
# Disponível em http://localhost:8080
```

## Configuração do Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar `SUPABASE_URL` e `SUPABASE_ANON_KEY` para o `.env`
3. Executar `EXECUTAR_NO_SUPABASE.sql` no SQL Editor do Supabase
4. Criar dois buckets no Storage: `product-images` e `module-content` (ambos públicos)

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## Comandos

```bash
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção
npm run lint       # ESLint
npm run preview    # preview do build
```

## Estrutura de Acesso

| Rota | Acesso |
|------|--------|
| `/auth/admin-login` | Login do administrador |
| `/auth/student-login` | Login do aluno |
| `/auth/signup` | Cadastro de novo administrador |
| `/admin/*` | Painel administrativo (role: admin) |
| `/student/*` | Área do aluno (role: user) |

## Funcionalidades

### Administrador
- Criar e gerenciar produtos (cursos)
- Criar módulos de conteúdo (vídeo, PDF, texto, quiz)
- Visualizar clientes e compras
- Configurar webhooks de pagamento
- Dashboard com analytics

### Aluno
- Acessar cursos comprados
- Acompanhar progresso por módulo
- Certificados de conclusão
- Notificações in-app

### Pagamentos (webhooks)
- Hotmart, Kiwify, Monetizze integrados via Edge Functions
- Stripe e Mercado Pago em desenvolvimento

## Deploy das Edge Functions

```bash
supabase login
supabase link --project-ref seu-project-id
supabase functions deploy
```

URL do webhook de pagamento:
```
https://seu-projeto.supabase.co/functions/v1/webhook-payment
```

## Promover usuário a admin

```sql
UPDATE public.user_roles SET role = 'admin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'seu@email.com');
```

## Licença

MIT
