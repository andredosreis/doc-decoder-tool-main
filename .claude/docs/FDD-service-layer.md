# FDD-003 — ServiceLayer

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-28  
**Autor:** André dos Reis  

---

## 1. Contexto

A v1.0 actual tem 18 páginas que chamam o cliente Supabase directamente. Esta ausência de camada de serviço mistura lógica de acesso a dados com lógica de UI, dificulta testes, gera inconsistências no tratamento de erros e impossibilita reutilização entre páginas.

O ServiceLayer resolve estes problemas estabelecendo uma fronteira clara: páginas e hooks comunicam apenas com serviços; serviços comunicam com Supabase, Edge Functions e Storage.

---

## 2. Objectivos

- Eliminar chamadas directas ao cliente Supabase fora de `src/services/`
- Centralizar tratamento de erros e tipos de retorno
- Encapsular TanStack Query em hooks dedicados por domínio
- Criar estrutura de ficheiros previsível e escalável
- Migrar sem regressões via PRs incrementais por domínio

---

## 3. Decisões Arquitecturais

### 3.1 Padrão de serviço

Objeto literal com métodos exportados como constante nomeada.

```typescript
// ✅ Padrão adoptado
export const productsService = {
  async list(): Promise<Product[]> { ... },
  async findById(id: string): Promise<Product | null> { ... },
  async create(data: ProductInsert): Promise<Product> { ... },
}

// ❌ Classes não usadas — overhead sem benefício em v1.0
export class ProductsService { ... }
```

**Justificação:** Sem necessidade de injecção de dependências, herança ou estado de instância na v1.0. Objeto literal é mais simples, tree-shakeable e alinha com o padrão existente no codebase.

### 3.2 Cliente Supabase

Importado directamente de `@/integrations/supabase/client` em cada serviço. Sem injecção via parâmetro.

```typescript
import { supabase } from '@/integrations/supabase/client'
```

**Justificação:** Injecção seria necessária apenas para testes unitários com mock do cliente. Na v1.0 os testes são de integração; a injecção adicionaria complexidade sem benefício imediato.

### 3.3 Tipos de retorno

| Situação | Retorno |
|---|---|
| Lista de entidades | Array vazio `[]` (nunca `null`) |
| Entidade única por ID | `null` se não encontrada (`maybeSingle()`) |
| Mutação com sucesso | Entidade criada/actualizada |
| Erro | Exception propagada |

Sem Result wrapper (`{ data, error }`). Erros propagam como exceptions e são tratados no hook level.

### 3.4 Tipos TypeScript

Database types auto-gerados com re-exports em `src/types/domain.ts` como aliases sem transformação.

```typescript
// src/types/domain.ts
import type { Database } from '@/integrations/supabase/types'

export type Product = Database['public']['Tables']['products']['Row']
export type Module  = Database['public']['Tables']['modules']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']

// Insert/Update types
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ModuleInsert  = Database['public']['Tables']['modules']['Insert']
export type ModuleUpdate  = Database['public']['Tables']['modules']['Update']
```

**Porquê o ficheiro mesmo sem transformação:** páginas importam de `@/types/domain`, não de `@/integrations/supabase/types`. Se o schema mudar, o impacto é visível neste ficheiro. Quando v2.0 precisar de transformação (ex: `Date` em vez de `string`), muda só aqui.

---

## 4. Estrutura de Ficheiros

```
src/
  services/
    _edge.ts                  ← helper interno (não importar directamente nas páginas)
    storage.service.ts        ← operações transversais de Storage
    auth.service.ts           ← auth stateless + Edge Functions
    products.service.ts       ← CRUD + upload de imagem
    modules.service.ts        ← CRUD + signed URLs de conteúdo
    purchases.service.ts      ← CRUD + gestão de estado
    progress.service.ts       ← UPSERT + cálculo de percentagem
    certificates.service.ts   ← geração + download URL
    notifications.service.ts  ← CRUD (sem Realtime)

  hooks/queries/
    keys.ts                   ← queryKeys factory centralizado
    useProducts.ts
    useModules.ts
    usePurchases.ts
    useProgress.ts
    useCertificates.ts
    useNotifications.ts       ← inclui Realtime subscription
    useAuth.ts

  types/
    domain.ts                 ← re-exports dos Database types

  lib/
    queryClient.ts            ← QueryClient com onError global
    supabase-errors.ts        ← helper isSupabaseError(error, code)
```

---

## 5. Implementação

### 5.1 Helper de Edge Functions

```typescript
// src/services/_edge.ts
import { supabase } from '@/integrations/supabase/client'

export async function invokeEdgeFunction<T>(
  name: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw error
  return data as T
}
```

**Regra:** `_edge.ts` não é importado directamente por páginas ou hooks. Apenas os serviços de domínio o usam.

### 5.2 Storage Service

```typescript
// src/services/storage.service.ts
import { supabase } from '@/integrations/supabase/client'

type Bucket =
  | 'product-images'
  | 'module-content'
  | 'avatars'
  | 'logos'
  | 'certificates'

interface UploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
}

export const storageService = {
  async upload(
    bucket: Bucket,
    path: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<string> {
    const { maxSizeMB = 50, allowedTypes } = options

    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`Ficheiro excede o limite de ${maxSizeMB}MB`)
    }
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de ficheiro não permitido: ${file.type}`)
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (error) throw error
    return path
  },

  async getSignedUrl(
    bucket: Bucket,
    path: string,
    expiresIn: number
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  async remove(bucket: Bucket, paths: string[]): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
  },
}
```

**Nota:** Os serviços de domínio chamam `storageService` internamente. Nunca chamam `supabase.storage` directamente.

### 5.3 Auth Service

Fronteira: `auth.service.ts` cobre operações stateless. `useAuth.tsx` mantém `onAuthStateChange`, `ProtectedRoute` e estado de sessão React.

```typescript
// src/services/auth.service.ts
import { supabase } from '@/integrations/supabase/client'
import { invokeEdgeFunction } from './_edge'

export const authService = {
  // Operações stateless de auth
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signup(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  // Edge Functions de administração
  async promoteAdmin(targetUserId: string): Promise<void> {
    return invokeEdgeFunction('promote-admin', {
      mode: 'promote',
      targetUserId,
    })
  },

  async inviteStudent(
    email: string,
    productId?: string
  ): Promise<{ inviteUrl: string }> {
    return invokeEdgeFunction('admin-invite-student', {
      email,
      product_id: productId,
    })
  },
}
```

`useAuth.tsx` após a migração:

```typescript
// src/hooks/useAuth.tsx (excerto relevante)
const signOut = async () => {
  await authService.logout()  // chama serviço
  setUser(null)               // actualiza estado React
  setSession(null)
  navigate('/login')
}
```

### 5.4 Products Service (exemplo completo)

```typescript
// src/services/products.service.ts
import { supabase } from '@/integrations/supabase/client'
import { storageService } from './storage.service'
import type { Product, ProductInsert } from '@/types/domain'

export const productsService = {
  async list(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async create(input: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, input: Partial<ProductInsert>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  async uploadImage(productId: string, file: File): Promise<string> {
    const path = `${productId}/cover.${file.name.split('.').pop()}`
    return storageService.upload('product-images', path, file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
  },
}
```

### 5.5 Modules Service (com signed URLs)

```typescript
// src/services/modules.service.ts
import { supabase } from '@/integrations/supabase/client'
import { storageService } from './storage.service'
import type { Module, ModuleInsert, ModuleUpdate } from '@/types/domain'

export const modulesService = {
  async listByProduct(productId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  // Vídeos: módulos do tipo `video` armazenam URL de embed do YouTube em
  // `module.video_url`. O frontend renderiza directamente via <iframe>; sem
  // signed URL e sem passar por Storage. Não há método `getVideoSignedUrl`.

  async getPdfSignedUrl(module: Module): Promise<string> {
    if (!module.pdf_url) throw new Error('Módulo sem PDF')
    return storageService.getSignedUrl('module-content', module.pdf_url, 3600)
  },

  async create(input: ModuleInsert): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, input: ModuleUpdate): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
```

### 5.6 Certificates Service (com Edge Function e signed URL)

```typescript
// src/services/certificates.service.ts
import { supabase } from '@/integrations/supabase/client'
import { storageService } from './storage.service'
import { invokeEdgeFunction } from './_edge'
import type { Certificate } from '@/types/domain'

export const certificatesService = {
  async findByUserAndProduct(
    userId: string,
    productId: string
  ): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async generate(productId: string): Promise<Certificate> {
    return invokeEdgeFunction<Certificate>('generate-certificate', {
      productId,
    })
  },

  async getDownloadUrl(cert: Certificate): Promise<string> {
    return storageService.getSignedUrl(
      'certificates',
      cert.pdf_url,
      300  // TTL curto — download imediato esperado
    )
  },
}
```

### 5.7 Notifications Service (sem Realtime)

```typescript
// src/services/notifications.service.ts
import { supabase } from '@/integrations/supabase/client'
import type { Notification } from '@/types/domain'

export const notificationsService = {
  async list(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) throw error
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  },
}

// Realtime subscription permanece em useNotifications.ts
// por ser preocupação de ciclo de vida React (mount/unmount)
```

---

## 6. TanStack Query

### 6.1 QueryKeys Factory

```typescript
// src/hooks/queries/keys.ts
export const keys = {
  products: {
    all: ['products'] as const,
    detail: (id: string) => ['products', id] as const,
  },
  modules: {
    byProduct: (productId: string) =>
      ['modules', 'byProduct', productId] as const,
    detail: (id: string) => ['modules', id] as const,
  },
  purchases: {
    all: ['purchases'] as const,
    byUser: (userId: string) => ['purchases', 'byUser', userId] as const,
  },
  progress: {
    byUserAndProduct: (userId: string, productId: string) =>
      ['progress', userId, productId] as const,
  },
  certificates: {
    byUserAndProduct: (userId: string, productId: string) =>
      ['certificates', userId, productId] as const,
  },
  notifications: {
    byUser: (userId: string) => ['notifications', userId] as const,
  },
} as const
```

### 6.2 staleTimes por domínio

| Domínio | staleTime | Justificação |
|---|---|---|
| Produtos | 5 min | Muda raramente; admin vê dados ligeiramente desactualizados sem problema |
| Módulos | 30 min | Conteúdo estável após publicação |
| Compras | 2 min | Estado de acesso pode mudar; não precisa de ser real-time |
| Certificados | 1 hora | Gerados uma vez; imutáveis após emissão |
| Progresso | 0 | Actualizado a cada interacção; sempre fresh |
| Notificações | 0 | Canal real-time; cache desactualizada prejudica UX |

### 6.3 Hook exemplo — useProducts

```typescript
// src/hooks/queries/useProducts.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { productsService } from '@/services/products.service'
import { keys } from './keys'
import { isSupabaseError } from '@/lib/supabase-errors'
import { toast } from '@/hooks/use-toast'

export const useProducts = () =>
  useQuery({
    queryKey: keys.products.all,
    queryFn: productsService.list,
    staleTime: 5 * 60 * 1000,
  })

export const useProduct = (id: string) =>
  useQuery({
    queryKey: keys.products.detail(id),
    queryFn: () => productsService.findById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })

export const useCreateProduct = () =>
  useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.products.all })
      toast({ title: 'Produto criado', description: 'Já disponível para alunos.' })
    },
    onError: (error: unknown) => {
      if (isSupabaseError(error, '23505')) {
        toast({
          title: 'Não foi possível criar',
          description: 'Já existe um produto com este nome.',
          variant: 'destructive',
        })
      } else {
        throw error  // propaga para onError global do QueryClient
      }
    },
  })

export const useDeleteProduct = () =>
  useMutation({
    mutationFn: productsService.remove,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.products.all })
      queryClient.removeQueries({ queryKey: keys.products.detail(id) })
      toast({ title: 'Produto removido' })
    },
  })
```

### 6.4 useNotifications com Realtime

```typescript
// src/hooks/queries/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { notificationsService } from '@/services/notifications.service'
import { keys } from './keys'

export const useNotifications = (userId: string) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: keys.notifications.byUser(userId),
    queryFn: () => notificationsService.list(userId),
    staleTime: 0,
    enabled: !!userId,
  })

  // Realtime fica no hook — preocupação de ciclo de vida React
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: keys.notifications.byUser(userId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return query
}
```

---

## 7. Tratamento de Erros

### 7.1 QueryClient com onError global

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro inesperado. Tenta novamente.'
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        })
      },
    },
  },
})
```

### 7.2 Helper de erros Supabase

```typescript
// src/lib/supabase-errors.ts
export function isSupabaseError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === code
  )
}

// Códigos relevantes em v1.0
// '23505' → unique constraint violation (nome duplicado, etc.)
// '23503' → foreign key violation
// 'PGRST116' → zero rows quando se usa .single() em vez de .maybeSingle()
// '42501' → RLS policy violation (acesso não autorizado)
```

### 7.3 Contrato de tratamento de erros

| Situação | Comportamento |
|---|---|
| Hook define `onError` com erro reconhecido | Toast contextual aparece; global não dispara |
| Hook define `onError` mas erro não é reconhecido | `throw error` → global dispara |
| Hook não define `onError` | Global dispara com mensagem genérica |
| `useQuery` com erro | Expõe `isError` + `error`; página decide como mostrar |

Queries (`useQuery`) não têm toast automático. Cada página trata `isError`/`error` localmente com empty state ou mensagem inline.

---

## 8. Estratégia de Migração

### 8.1 Plano de PRs

**PR 0 — Fundações** *(sem toque em páginas)*
- `src/services/_edge.ts`
- `src/services/storage.service.ts`
- `src/hooks/queries/keys.ts`
- `src/types/domain.ts`
- `src/lib/queryClient.ts`
- `src/lib/supabase-errors.ts`

Sem risco. Apenas cria ficheiros novos. Desbloqueia todos os PRs seguintes.

**PR 1 — Auth** *(bloqueador de go-live — Risco 2 do HLD)*
- `src/services/auth.service.ts`
- Refactor `useAuth.tsx` → consome `authService`
- Refactor `Signup.tsx` → remove UPDATE directo em `user_roles`

**PR 2 — Produtos**
- `src/services/products.service.ts`
- `src/hooks/queries/useProducts.ts`
- Refactor `admin/Products.tsx`, `admin/Dashboard.tsx`

**PR 3 — Módulos**
- `src/services/modules.service.ts`
- `src/hooks/queries/useModules.ts`
- Refactor `admin/Modules.tsx`, `student/ModuleView.tsx`, `student/ProductView.tsx`

**PR 4 — Compras e Alunos**
- `src/services/purchases.service.ts`
- `src/hooks/queries/usePurchases.ts`
- Refactor `admin/Purchases.tsx`, `admin/Customers.tsx`, `admin/Users.tsx`

**PR 5 — Progresso e Certificados**
- `src/services/progress.service.ts`
- `src/services/certificates.service.ts`
- `src/hooks/queries/useProgress.ts`, `src/hooks/queries/useCertificates.ts`
- Refactor `student/Dashboard.tsx`, `student/Certificate.tsx`

**PR 6 — Notificações**
- `src/services/notifications.service.ts`
- `src/hooks/queries/useNotifications.ts` (com Realtime)
- Refactor `NotificationDropdown.tsx`

### 8.2 Regra temporária durante migração

Durante os PRs 1–5, páginas ainda não migradas podem continuar a usar Supabase directamente. Isto é **temporariamente aceite** e não deve ser corrigido fora do PR do respectivo domínio.

A regra **"sem chamadas directas ao Supabase fora de `src/services/`"** entra em vigor após o merge do PR 6.

> ⚠️ Registar no `CLAUDE.md` como regra temporária com data de activação após PR 6.

---

## 9. Restrições e Regras

1. `_edge.ts` não é importado directamente por páginas ou hooks — apenas por serviços de domínio
2. `storageService` é consumido pelos serviços de domínio; páginas não chamam `supabase.storage` directamente
3. Realtime fica em `useNotifications` — não migrar para o serviço
4. `maybeSingle()` para queries que podem retornar zero rows; nunca `.single()` sem garantia de resultado
5. Arrays vazios para listas; nunca `null` como retorno de `.list()`
6. Hooks de query não têm toast — apenas hooks de mutation
7. `src/types/domain.ts` é o único ponto de importação de tipos de entidade nas páginas

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Regressão durante migração incremental | PR por domínio + testes manuais do fluxo crítico em cada PR |
| Inconsistência temporária com páginas mistas | Regra documentada no CLAUDE.md; CI não bloqueia durante migração |
| `onError` global engolir erros de negócio silenciosamente | Convenção `throw error` no handler contextual para propagar ao global |
| signed URLs expirarem em cache TanStack | `staleTime: 0` para queries de URL; gerar URL sempre que componente monta |

---

## 11. Próximos Passos

1. Correr `/research` para verificar versões exactas de `@tanstack/react-query`, `supabase-js` e `typescript`
2. Criar branch `feature/service-layer-foundations`
3. Implementar PR 0 (fundações — sem alterações a páginas)
4. Implementar PR 1 (auth + Risco 2) como bloqueador de go-live
5. Seguir sequência PR 2 → PR 6

---

*FDD gerado após sessão de entrevista arquitectural completa. Todas as decisões foram tomadas de forma colaborativa e confirmadas antes da redacção.*
