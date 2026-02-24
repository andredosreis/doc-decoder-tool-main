# 👨‍💻 Guia de Desenvolvimento

Este guia fornece todas as informações necessárias para desenvolver e contribuir com a plataforma.

---

## 📋 Índice

1. [Setup do Ambiente](#-setup-do-ambiente)
2. [Estrutura do Código](#-estrutura-do-código)
3. [Convenções](#-convenções)
4. [Desenvolvimento de Features](#-desenvolvimento-de-features)
5. [Trabalhando com Componentes](#-trabalhando-com-componentes)
6. [Serviços e APIs](#-serviços-e-apis)
7. [Edge Functions](#-edge-functions)
8. [Testing](#-testing)
9. [Debug](#-debug)
10. [Performance](#-performance)

---

## 🚀 Setup do Ambiente

### Extensões Recomendadas (VS Code)

Instale as seguintes extensões para melhor experiência:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Configuração do Editor

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Atalhos Úteis

```bash
# Iniciar dev server
npm run dev

# Build
npm run build

# Preview do build
npm run preview

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📁 Estrutura do Código

### Organização de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── Admin/          # Componentes administrativos
│   │   ├── AppCreator.tsx
│   │   ├── ProductManager.tsx
│   │   └── CustomerList.tsx
│   ├── Client/         # Componentes do cliente
│   │   ├── ProductGrid.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── PDFViewer.tsx
│   ├── Auth/           # Autenticação
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── ui/             # Componentes shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── pages/              # Páginas da aplicação
│   ├── Index.tsx       # Landing page
│   ├── admin/          # Área admin
│   │   ├── Dashboard.tsx
│   │   ├── Apps.tsx
│   │   └── Customers.tsx
│   └── app/            # PWA do cliente
│       ├── Home.tsx
│       ├── Product.tsx
│       └── Module.tsx
│
├── services/           # Lógica de negócio
│   ├── database.service.ts    # CRUD genérico
│   ├── apps.service.ts        # Gestão de apps
│   ├── products.service.ts    # Gestão de produtos
│   ├── storage.service.ts     # Upload de arquivos
│   └── webhooks.service.ts    # Integração pagamentos
│
├── hooks/              # Custom React Hooks
│   ├── useAuth.tsx
│   ├── useProducts.tsx
│   └── useProgress.tsx
│
├── contexts/           # React Context (estado global)
│   ├── AuthContext.tsx
│   └── AppContext.tsx
│
├── config/             # Configurações
│   ├── app.config.ts
│   └── constants.ts
│
├── types/              # TypeScript types
│   ├── database.types.ts
│   ├── app.types.ts
│   └── product.types.ts
│
├── utils/              # Funções utilitárias
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
│
└── integrations/       # Integrações externas
    └── supabase/
        ├── client.ts
        └── types.ts
```

### Quando Criar Cada Tipo de Arquivo

| Tipo | Quando Criar | Exemplo |
|------|--------------|---------|
| **Component** | UI reutilizável | `Button.tsx`, `Card.tsx` |
| **Page** | Nova rota | `Dashboard.tsx`, `Profile.tsx` |
| **Service** | Lógica de negócio | `auth.service.ts` |
| **Hook** | Lógica reutilizável | `useLocalStorage.tsx` |
| **Context** | Estado global | `ThemeContext.tsx` |
| **Type** | Tipagem TypeScript | `user.types.ts` |
| **Utils** | Funções auxiliares | `formatDate.ts` |

---

## 📝 Convenções

### Nomenclatura

#### Arquivos e Componentes
```typescript
// ✅ CORRETO - PascalCase para componentes
ProductCard.tsx
UserProfile.tsx
DashboardLayout.tsx

// ❌ ERRADO
productCard.tsx
userprofile.tsx
dashboard-layout.tsx
```

#### Serviços
```typescript
// ✅ CORRETO - camelCase com .service.ts
auth.service.ts
products.service.ts
storage.service.ts

// ❌ ERRADO
AuthService.ts
products-service.ts
```

#### Hooks
```typescript
// ✅ CORRETO - camelCase com prefixo 'use'
useAuth.tsx
useProducts.tsx
useLocalStorage.tsx

// ❌ ERRADO
Auth.tsx
products-hook.tsx
localStorage.tsx
```

#### Types e Interfaces
```typescript
// ✅ CORRETO - PascalCase
interface UserProfile {
  id: string;
  name: string;
}

type ProductType = 'course' | 'ebook' | 'video';

// ❌ ERRADO
interface userProfile { }
type product_type = string;
```

### Imports

Sempre use path alias `@/`:

```typescript
// ✅ CORRETO
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ❌ ERRADO
import { Button } from "../../components/ui/button";
import { useAuth } from "../../../hooks/useAuth";
```

### Ordenação de Imports

```typescript
// 1. Imports externos
import React from "react";
import { useNavigate } from "react-router-dom";

// 2. Imports internos (@/)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// 3. Imports de tipos
import type { User } from "@/types/user.types";

// 4. Imports de CSS (se houver)
import "./styles.css";
```

### Comentários

```typescript
// ✅ ONDE MUDAR: Indica pontos de customização
// ONDE MUDAR: Altere aqui para mudar a cor primária
const PRIMARY_COLOR = "#4F46E5";

// ✅ TODO: Funcionalidades futuras
// TODO: Adicionar paginação na lista de produtos

// ✅ FIXME: Bugs conhecidos
// FIXME: Bug no carregamento de vídeos grandes

// ✅ IMPORTANTE: Atenção especial
// IMPORTANTE: Nunca exponha a service_role key no frontend

// ✅ NOTE: Notas importantes
// NOTE: Esta função só funciona com produtos publicados
```

---

## 🎨 Desenvolvimento de Features

### Fluxo de Desenvolvimento

1. **Criar branch**
```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolver**
   - Escrever código
   - Testar localmente
   - Adicionar comentários

3. **Commit**
```bash
git add .
git commit -m "feat: adiciona funcionalidade X"
```

4. **Push e PR**
```bash
git push origin feature/nome-da-feature
# Abrir Pull Request no GitHub
```

### Exemplo: Adicionar Nova Feature

**Cenário:** Adicionar sistema de comentários nos módulos

#### 1. Criar Tipo
```typescript
// src/types/comment.types.ts
export interface Comment {
  id: string;
  module_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}
```

#### 2. Criar Serviço
```typescript
// src/services/comments.service.ts
import { supabase } from "@/integrations/supabase/client";
import type { Comment } from "@/types/comment.types";

export const commentsService = {
  async getComments(moduleId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(name, avatar_url)')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addComment(moduleId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({ module_id: moduleId, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
```

#### 3. Criar Hook
```typescript
// src/hooks/useComments.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "@/services/comments.service";

export function useComments(moduleId: string) {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', moduleId],
    queryFn: () => commentsService.getComments(moduleId)
  });

  const addComment = useMutation({
    mutationFn: (content: string) =>
      commentsService.addComment(moduleId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', moduleId]);
    }
  });

  return { comments, isLoading, addComment };
}
```

#### 4. Criar Componente
```typescript
// src/components/Client/CommentSection.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";

interface CommentSectionProps {
  moduleId: string;
}

export function CommentSection({ moduleId }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const { comments, isLoading, addComment } = useComments(moduleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addComment.mutateAsync(content);
    setContent("");
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comentários</h3>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Adicione um comentário..."
        />
        <Button type="submit">Enviar</Button>
      </form>

      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="border-l-2 pl-4">
            <p className="font-semibold">{comment.user.name}</p>
            <p className="text-sm text-gray-600">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5. Usar no Módulo
```typescript
// src/pages/app/Module.tsx
import { CommentSection } from "@/components/Client/CommentSection";

export function ModulePage() {
  const { moduleId } = useParams();

  return (
    <div>
      {/* ... conteúdo do módulo ... */}

      <CommentSection moduleId={moduleId} />
    </div>
  );
}
```

---

## 🧩 Trabalhando com Componentes

### Componentes UI (shadcn/ui)

#### Adicionar Novo Componente

```bash
# Usar CLI do shadcn
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

#### Customizar Componente

```typescript
// src/components/ui/button.tsx
import { cn } from "@/lib/utils";

// Adicionar nova variante
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        // ✅ Nova variante
        gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      }
    }
  }
);
```

### Componentes Compostos

```typescript
// src/components/Admin/ProductCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{product.description}</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={onEdit}>Editar</Button>
          <Button variant="destructive" onClick={onDelete}>
            Deletar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔌 Serviços e APIs

### Padrão de Serviço

```typescript
// src/services/example.service.ts
import { supabase } from "@/integrations/supabase/client";
import type { Example } from "@/types/example.types";

export const exampleService = {
  // ✅ GET - Buscar todos
  async getAll(): Promise<Example[]> {
    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // ✅ GET - Buscar por ID
  async getById(id: string): Promise<Example> {
    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // ✅ POST - Criar
  async create(example: Partial<Example>): Promise<Example> {
    const { data, error } = await supabase
      .from('examples')
      .insert(example)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ✅ PUT - Atualizar
  async update(id: string, updates: Partial<Example>): Promise<Example> {
    const { data, error } = await supabase
      .from('examples')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ✅ DELETE - Deletar
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('examples')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
```

### Error Handling

```typescript
// src/services/products.service.ts
import { toast } from "sonner";

export const productsService = {
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
      throw error;
    }
  }
};
```

---

## ⚡ Edge Functions

### Criar Nova Edge Function

```bash
# Criar estrutura
mkdir -p supabase/functions/minha-function
touch supabase/functions/minha-function/index.ts
```

### Template de Edge Function

```typescript
// supabase/functions/minha-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Inicializar Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Parse request body
    const { param1, param2 } = await req.json();

    // Sua lógica aqui
    // ...

    // Retornar resposta
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
```

### Deploy e Test

```bash
# Deploy
supabase functions deploy minha-function

# Testar localmente
supabase functions serve minha-function

# Ver logs
supabase functions logs minha-function --tail
```

---

## 🧪 Testing

### Testar Componentes Manualmente

```typescript
// Criar página de teste
// src/pages/TestPage.tsx
import { Button } from "@/components/ui/button";

export function TestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1>Teste de Componentes</h1>

      <div>
        <h2>Buttons</h2>
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  );
}
```

### Testar Edge Functions

```bash
# Teste via curl
curl -X POST \
  'https://seu-projeto.supabase.co/functions/v1/minha-function' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"param1": "value1"}'
```

---

## 🐛 Debug

### Debug no Browser

```typescript
// Adicionar breakpoints no código
function myFunction() {
  debugger; // ← Execução para aqui
  // ...
}

// Logs úteis
console.log('Valor:', value);
console.table(array);
console.error('Erro:', error);
```

### Debug do Supabase

```typescript
// Ver queries
const { data, error } = await supabase
  .from('products')
  .select('*');

console.log('Data:', data);
console.log('Error:', error);
```

### React DevTools

1. Instale: [React Developer Tools](https://react.dev/learn/react-developer-tools)
2. Abra DevTools (F12)
3. Vá na aba "Components"
4. Inspecione props e state

---

## ⚡ Performance

### Lazy Loading

```typescript
// ✅ Carregar componentes sob demanda
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### Memoização

```typescript
import { memo, useMemo, useCallback } from "react";

// ✅ Memorizar componente
export const ProductCard = memo(({ product }) => {
  return <Card>{product.name}</Card>;
});

// ✅ Memorizar valor calculado
function ProductList({ products }) {
  const total = useMemo(() => {
    return products.reduce((sum, p) => sum + p.price, 0);
  }, [products]);

  return <div>Total: {total}</div>;
}

// ✅ Memorizar callback
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
}
```

### Otimizar Imagens

```typescript
// ✅ Lazy loading de imagens
<img
  src={product.image_url}
  loading="lazy"
  alt={product.name}
/>

// ✅ Usar WebP quando possível
// No Supabase Storage, configure transformações automáticas
```

---

## 📚 Recursos Adicionais

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

---

**Happy coding!** 🚀
