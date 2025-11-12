# 🏗️ Arquitetura da Plataforma

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── Admin/          # Componentes do painel administrativo
│   │   ├── AppCreator.tsx
│   │   ├── ProductManager.tsx
│   │   └── CustomerList.tsx
│   ├── Client/         # Componentes do app do cliente final
│   │   ├── ProductGrid.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── PDFViewer.tsx
│   ├── Auth/           # Componentes de autenticação
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── ui/             # Componentes de UI (shadcn)
│
├── pages/              # Páginas da aplicação (rotas)
│   ├── Index.tsx       # Landing page
│   ├── admin/          # Área administrativa
│   │   ├── Dashboard.tsx
│   │   ├── Apps.tsx
│   │   └── Customers.tsx
│   └── app/            # PWA do cliente
│       ├── Home.tsx
│       ├── Product.tsx
│       └── Module.tsx
│
├── services/           # Lógica de negócio e chamadas API
│   ├── database.service.ts    # CRUD genérico
│   ├── apps.service.ts        # Gestão de apps
│   ├── products.service.ts    # Gestão de produtos
│   ├── storage.service.ts     # Upload de arquivos
│   └── webhooks.service.ts    # Integração pagamentos
│
├── hooks/              # Custom React Hooks
│   ├── useAuth.tsx             # Hook de autenticação
│   ├── useProducts.tsx         # Hook para produtos
│   └── useProgress.tsx         # Hook para progresso do usuário
│
├── contexts/           # React Contexts (estado global)
│   ├── AuthContext.tsx         # Contexto de autenticação
│   └── AppContext.tsx          # Contexto do app atual
│
├── config/             # Configurações centralizadas
│   ├── app.config.ts           # Configurações gerais
│   └── constants.ts            # Constantes da aplicação
│
├── types/              # TypeScript types e interfaces
│   ├── database.types.ts       # Types do banco de dados
│   ├── app.types.ts            # Types de apps
│   └── product.types.ts        # Types de produtos
│
├── utils/              # Funções utilitárias
│   ├── formatters.ts           # Formatação de dados
│   ├── validators.ts           # Validações
│   └── helpers.ts              # Funções auxiliares
│
└── integrations/       # Integrações externas
    └── supabase/       # Cliente Supabase (gerado automaticamente)
        ├── client.ts
        └── types.ts
```

## 🗄️ Esquema do Banco de Dados

### Tabelas Principais

#### 1. `apps` - Aplicativos criados pelos admins
```sql
id              UUID PRIMARY KEY
user_id         UUID (dono do app)
name            TEXT
slug            TEXT UNIQUE (URL: /app/{slug})
theme_colors    JSONB (cores personalizadas)
logo_url        TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### 2. `products` - Produtos/Cursos dentro de cada app
```sql
id              UUID PRIMARY KEY
app_id          UUID FOREIGN KEY -> apps(id)
name            TEXT
description     TEXT
image_url       TEXT
order           INTEGER (ordem de exibição)
is_published    BOOLEAN
created_at      TIMESTAMP
```

#### 3. `modules` - Módulos/Aulas dentro de produtos
```sql
id              UUID PRIMARY KEY
product_id      UUID FOREIGN KEY -> products(id)
title           TEXT
description     TEXT
type            TEXT (video, pdf, text, quiz)
content_url     TEXT (URL do vídeo/PDF no storage)
duration        INTEGER (em segundos)
order           INTEGER
is_free         BOOLEAN (preview grátis)
```

#### 4. `customers` - Clientes que compraram acesso
```sql
id              UUID PRIMARY KEY
app_id          UUID FOREIGN KEY -> apps(id)
email           TEXT
name            TEXT
phone           TEXT
purchase_id     TEXT (ID da compra Hotmart/Kiwify)
status          TEXT (active, expired, cancelled)
expires_at      TIMESTAMP
created_at      TIMESTAMP
```

#### 5. `customer_progress` - Progresso dos clientes
```sql
id              UUID PRIMARY KEY
customer_id     UUID FOREIGN KEY -> customers(id)
module_id       UUID FOREIGN KEY -> modules(id)
completed       BOOLEAN
progress_percent INTEGER (0-100)
last_watched_at TIMESTAMP
```

## 🔐 Segurança (Row Level Security)

### Políticas RLS Implementadas

**Apps:**
- Admins podem ver/editar apenas seus próprios apps
- Clientes podem ver apps que compraram

**Products/Modules:**
- Públicos para visualização (PWA)
- Apenas admin do app pode editar

**Customers:**
- Admin vê clientes do seu app
- Cliente vê apenas seus próprios dados

**Progress:**
- Cada cliente vê apenas seu progresso

## 🚀 Fluxo de Dados

### 1. Criação de App (Admin)
```
Admin → AppCreator Component → apps.service.ts → Supabase → apps table
```

### 2. Upload de Conteúdo
```
Admin → FileUpload → storage.service.ts → Supabase Storage → URL salva no módulo
```

### 3. Compra de Cliente (Webhook)
```
Hotmart/Kiwify → Edge Function (webhook) → Validação → customers table
```

### 4. Acesso do Cliente (PWA)
```
Cliente → Login → Validação → Lista de produtos → Visualiza módulos → Atualiza progresso
```

## 🎨 Sistema de Temas

### Arquivos Principais
- `src/index.css` - Variáveis CSS (cores, fontes, espaçamentos)
- `tailwind.config.ts` - Configuração Tailwind

### Como Personalizar Cores
```typescript
// src/config/app.config.ts
export const THEME_PRESETS = {
  blue: {
    primary: 'hsl(217, 91%, 60%)',
    secondary: 'hsl(217, 91%, 45%)',
  },
  purple: {
    primary: 'hsl(262, 83%, 58%)',
    secondary: 'hsl(262, 83%, 45%)',
  },
  // Adicionar mais presets aqui
};
```

### Onde Mudar Design
1. **Cores globais:** `src/index.css` (variáveis --primary, --secondary, etc.)
2. **Componentes:** `src/components/ui/` (componentes shadcn personalizáveis)
3. **Layouts:** `src/pages/` (estrutura das páginas)

## 🔌 Integrações

### 1. Pagamentos (Hotmart/Kiwify/Monetizze)
**Arquivo:** `supabase/functions/payment-webhook/index.ts`
**Função:** Recebe notificação de compra e libera acesso

### 2. WhatsApp (Futuro)
**Arquivo:** `supabase/functions/whatsapp-notify/index.ts`
**Função:** Enviar notificações aos clientes

### 3. Email (Futuro)
**Arquivo:** `supabase/functions/send-email/index.ts`
**Função:** Recuperação de senha, boas-vindas

## 📱 PWA (Progressive Web App)

### Configuração
**Arquivo:** `public/manifest.json`
**Service Worker:** `public/sw.js` (para instalação)

### Como Testar
1. Abrir o app no celular: `https://seuapp.lovable.app`
2. Chrome: Menu → "Instalar aplicativo"
3. Safari (iOS): Compartilhar → "Adicionar à Tela Inicial"

## 🧪 Testes e Debug

### Console Logs
Verificar erros em tempo real no Lovable

### Logs do Backend
Ver logs das Edge Functions no painel Lovable Cloud

### Database Explorer
Visualizar dados diretamente no painel Lovable Cloud

## 🔄 Deploy

### Automático
- Qualquer mudança no código é automaticamente deployed
- Edge Functions são deployed junto com o código

### Domínio Customizado
1. Ir em Settings → Domains
2. Adicionar CNAME: `seu-dominio.com` → `seuapp.lovable.app`

## 📝 Convenções de Código

### Nomenclatura
- **Componentes:** PascalCase (`ProductCard.tsx`)
- **Serviços:** camelCase com `.service.ts` (`apps.service.ts`)
- **Hooks:** camelCase com `use` prefixo (`useProducts.tsx`)
- **Types:** PascalCase com sufixo (`ProductType`, `AppConfig`)

### Comentários
- `// ONDE MUDAR:` - Indica pontos de customização
- `// TODO:` - Funcionalidades futuras
- `// FIXME:` - Bugs conhecidos para corrigir
- `// IMPORTANTE:` - Atenção especial necessária

### Imports
Sempre usar path alias `@/`:
```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
```
