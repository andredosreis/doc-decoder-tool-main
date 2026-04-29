# FDD-005 — Sistema de Progresso e Certificação

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-28  
**Autor:** André dos Reis  

---

## 1. Contexto

A tabela `public.user_progress` existe no schema com colunas `completed`, `progress_percentage`, `last_position_seconds` e `completed_at`. Todas estas colunas estão presentes mas o uso actual é incoerente:

- `progress_percentage` é populado apenas como **boolean disfarçado** (0 ou 100). O método `markAsComplete` em `student/ModuleView.tsx` define `completed=true, progress_percentage=100` em conjunto. Não há registo real de "55% do vídeo visto".
- `last_position_seconds` está no schema mas **nenhum código escreve neste campo**. A funcionalidade "continuar de onde parei" não existe.
- O UPSERT é feito como SELECT + UPDATE/INSERT manual, sujeito a race condition entre check e write.
- O cálculo de progresso agregado por produto está **duplicado em três páginas** (`student/Certificate.tsx`, `student/ProductView.tsx`, `student/Dashboard.tsx`) e na Edge Function `generate-certificate`. Cada local conta `% módulos completed=true` à mão.
- Não existe view SQL nem RPC que exponha o agregado canónico. O FDD-004 assume que essa primitiva existe; este FDD cria-a.

Este FDD define a evolução do sistema de progresso para v1.0 funcional: progresso real para vídeo via eventos do player, marcação binária para PDF e texto, UPSERT atómico, agregação canónica via view SQL `v_user_product_progress` e disparo client-driven do certificado quando o aluno atinge 90% dos módulos concluídos.

**Estado actual vs estado alvo:**

| Aspecto | Estado actual | Estado alvo (este FDD) |
|---|---|---|
| `progress_percentage` por módulo (vídeo) | Sempre 0 ou 100 | Real: `min(100, round(position/duration*100))` com debounce 10 s |
| `progress_percentage` por módulo (PDF/texto) | Sempre 0 ou 100 | Mantém binário 0 ou 100; sem mudança |
| `last_position_seconds` | Não escrito | Escrito junto com `progress_percentage` em vídeos |
| Padrão de escrita | SELECT + UPDATE/INSERT manual | `.upsert({ onConflict: 'user_id,module_id' })` atómico |
| Agregação por produto | Recálculo inline em 3 páginas + 1 Edge Function | View SQL `v_user_product_progress` (fonte de verdade única) |
| Trigger do certificado | Lógica ad-hoc no frontend após cálculo manual | UI lê `v_user_product_progress.progress_percentage`; quando >= 90 e sem `certificate`, mostra botão |
| Monotonicidade do progresso | Não garantida (regressão possível por seek-back) | Trigger SQL `BEFORE UPDATE` aplica `GREATEST(novo, antigo)` em `progress_percentage` e `completed` |

---

## 2. Objectivos

- Implementar registo real de progresso de vídeo via **YouTube IFrame Player API** (vídeos são YouTube embeds em v1.0; `module.video_url` armazena URL de embed do YouTube). Polling de 10 s enquanto o vídeo está em PLAYING; persistência imediata nos eventos PAUSED, ENDED e na limpeza do `useEffect`.
- Substituir SELECT + UPDATE/INSERT manual por `.upsert` atómico em todos os pontos de escrita de progresso.
- Criar a view SQL `v_user_product_progress` como fonte canónica de progresso agregado por `(user_id, product_id)`, consumida pela UI e pela Edge Function `generate-certificate` (FDD-004).
- Eliminar as três duplicações de cálculo agregado no frontend.
- Garantir monotonicidade de `progress_percentage` e `completed` ao nível da base de dados.
- Definir contracto de tipos (`UserProgress`, `UserProductProgress`) consumido pelo ServiceLayer.
- Manter trigger do certificado client-driven em v1.0; SQL trigger via `pg_net` fica registado como alvo v2.0.

Fora do âmbito deste FDD:
- Trigger SQL `pg_net` automático ao atingir 90% (alvo v2.0).
- Tipo de módulo `quiz` (declarado no enum mas não funcionalmente implementado per HLD §"Dívidas técnicas").
- Override manual de progresso pelo admin.
- Reset de progresso (re-fazer curso).
- Backfill de progresso de plataformas externas.

---

## 3. Decisões Arquitecturais

### 3.1 Granularidade do progresso por tipo de módulo

| Tipo | `progress_percentage` | `last_position_seconds` | Trigger de `completed=true` |
|---|---|---|---|
| `video` | `min(100, round(position/duration*100))` calculado client-side a partir de `player.getCurrentTime()` e `player.getDuration()` da YouTube IFrame Player API | Posição actual em segundos via `player.getCurrentTime()` | `progress_percentage >= 95` ou estado `YT.PlayerState.ENDED` |
| `pdf` | 0 ou 100 | Não usado (mantém 0) | Acção explícita do aluno (botão "Marcar como concluído") |
| `text` | 0 ou 100 | Não usado (mantém 0) | Acção explícita do aluno (botão "Marcar como concluído") |
| `quiz` | Fora de âmbito v1.0 | Fora de âmbito | Fora de âmbito |

**Justificação:** Vídeo é o único tipo onde "% visto" tem semântica natural e UX imediata (continuar de onde parei). PDF e texto são consumo discreto onde tracking parcial não compensa o custo de implementação. O sentinel de 95% para vídeo cobre o caso comum de aluno que não vê os últimos segundos de créditos ou agradecimentos. Como vídeos são YouTube embeds, o cálculo depende da YouTube IFrame Player API estar carregada e o player estar no estado `READY` antes de qualquer leitura — sem isso, persists são silenciosamente ignorados (Risco P3).

### 3.2 Cálculo agregado por produto

**% de módulos com `completed=true`** sobre total de módulos do produto.

```
progress_percentage_produto = round(100 * modules_completed / modules_total)
```

Threshold do certificado: `progress_percentage_produto >= 90`.

**Justificação:** Modelo binário por módulo é mais previsível para o aluno ("falta 1 módulo" em vez de "falta 11.4%") e mais simples de implementar (uma agregação SQL). Independente da granularidade interna do `progress_percentage` por módulo escolhida em §3.1: o que conta para o agregado é a flag `completed`. Vídeos contribuem para o produto quando atingem o sentinel de 95%; PDFs e textos quando o aluno marca como concluído.

### 3.3 Primitiva canónica de leitura: view SQL `v_user_product_progress`

```sql
CREATE OR REPLACE VIEW public.v_user_product_progress
WITH (security_invoker = on) AS
WITH product_module_counts AS (
  SELECT product_id, COUNT(*) AS modules_total
  FROM public.modules
  GROUP BY product_id
),
user_progress_by_product AS (
  SELECT
    up.user_id,
    m.product_id,
    COUNT(*) FILTER (WHERE up.completed) AS modules_completed,
    MAX(up.completed_at) FILTER (WHERE up.completed) AS completed_at
  FROM public.user_progress up
  JOIN public.modules m ON m.id = up.module_id
  GROUP BY up.user_id, m.product_id
)
SELECT
  upbp.user_id,
  upbp.product_id,
  pmc.modules_total,
  upbp.modules_completed,
  CASE
    WHEN pmc.modules_total = 0 THEN 0
    ELSE ROUND(100.0 * upbp.modules_completed / pmc.modules_total)::INTEGER
  END AS progress_percentage,
  upbp.completed_at
FROM user_progress_by_product upbp
JOIN product_module_counts pmc ON pmc.product_id = upbp.product_id;
```

Colunas expostas: `user_id`, `product_id`, `modules_total`, `modules_completed`, `progress_percentage`, `completed_at`.

**`security_invoker = on`** força a view a executar com a role do utilizador autenticado. Como `user_progress` tem RLS `auth.uid() = user_id`, a view filtra automaticamente para retornar apenas linhas do utilizador autenticado.

**Justificação:** Lógica de agregação em apenas um sítio (SQL); UI e Edge Function consomem o mesmo SELECT. Sem coluna denormalizada, sem trigger de manutenção, sem stale data. Performance aceitável para a escala v1.0; thresholds de revisão definidos no Risco P1.

### 3.4 Padrão de escrita: `.upsert` atómico

```typescript
await supabase
  .from('user_progress')
  .upsert({
    user_id, module_id,
    progress_percentage, last_position_seconds, completed, completed_at,
  }, { onConflict: 'user_id,module_id' })
```

**Justificação:** Substitui o padrão actual SELECT + UPDATE/INSERT que tem race condition entre verificar e escrever. UPSERT é atómico, funciona em duas chamadas concorrentes, e reduz código.

### 3.5 Monotonicidade ao nível da base de dados

Trigger SQL `BEFORE UPDATE` em `user_progress` impede regressão de `progress_percentage` e `completed`:

```sql
CREATE OR REPLACE FUNCTION public.user_progress_monotonic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress_percentage := GREATEST(NEW.progress_percentage, OLD.progress_percentage);
  NEW.completed := NEW.completed OR OLD.completed;
  IF NEW.completed AND OLD.completed_at IS NOT NULL THEN
    NEW.completed_at := OLD.completed_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_progress_monotonic_progress
BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.user_progress_monotonic();
```

`last_position_seconds` **pode** decrescer (aluno faz seek para trás para rever; este é o valor de "onde estou agora", não "máximo já visto").

**Justificação:** Garante semântica correcta independente da disciplina do cliente. Aluno que abre o vídeo em duas abas, ou que faz seek para o início, não regride o progresso. `completed=true` é sticky: uma vez marcado, fica.

### 3.6 Throttling no player de vídeo (YouTube IFrame API)

A YouTube IFrame Player API não emite um equivalente directo a `timeupdate` (HTML5). A estratégia em vez disso é **polling com `setInterval` enquanto `YT.PlayerState.PLAYING`**, suspenso quando o aluno faz pause ou o vídeo termina:

| Evento / Estado | Acção |
|---|---|
| `onStateChange` → `PLAYING` (estado `1`) | Inicia `setInterval` que dispara `persist()` a cada 10 s |
| `onStateChange` → `PAUSED` (estado `2`) | Cancela intervalo; persist imediato |
| `onStateChange` → `ENDED` (estado `0`) | Cancela intervalo; persist imediato com `progress_percentage = 100` e `completed=true` forçado |
| `onStateChange` → `BUFFERING` (estado `3`) | Mantém intervalo activo (network glitch, não pause de utilizador) |
| Unmount do componente (cleanup do useEffect) | Cancela intervalo; persist imediato; `player.destroy()` |
| `beforeunload` (fechar aba a meio do vídeo) | Fora de âmbito v1.0; aceita perda até 10 s desde último persist. Alvo v1.x: handler `beforeunload` com `navigator.sendBeacon` para Edge Function dedicada |

**Justificação:** A IFrame Player API não expõe um stream contínuo de `timeupdate`. Polling de 10 s replica o comportamento desejado (persist sub-10 s) sem a sobrecarga que `timeupdate` HTML5 traria (~4 Hz). Polling apenas em `PLAYING` evita persist desnecessário enquanto o vídeo está parado. Os eventos terminais (`PAUSED`, `ENDED`, unmount) garantem que nenhum momento crítico de transição é perdido.

### 3.7 Trigger client-driven do certificado

Em v1.0, sem trigger automático no DB. O fluxo é:

1. Aluno consome módulo; player ou botão "Marcar como concluído" actualiza `user_progress`.
2. Frontend invalida `useUserProductProgress(userId, productId)` na success do mutation.
3. View `v_user_product_progress` é re-consultada; novo `progress_percentage` reflecte mudança.
4. UI renderiza secção de certificado: se `progress_percentage >= 90` e `useCertificate(userId, productId)` retorna null, mostra botão "Gerar certificado".
5. Botão chama `useGenerateCertificate.mutate(productId)` (FDD-004).

**Justificação:** Aluno controla o momento de emitir; permite revisar antes. Sem dependência de `pg_net` configurado em v1.0. Estado alvo (v2.0) per HLD: trigger SQL após UPDATE em `user_progress` invoca `generate-certificate` via `pg_net`.

---

## 4. Fluxo end-to-end

```
┌──────────────────────────────────────────────────────────────────┐
│ Aluno consome módulo (player de vídeo OU PDF/texto)              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
       ┌───────────────────┴────────────────────┐
       ▼                                        ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│ Vídeo (timeupdate/      │       │ PDF ou texto                │
│  pause/ended/unmount)   │       │ Botão "Marcar concluído"    │
│                         │       │                             │
│ useVideoProgress hook   │       │ useMarkModuleComplete       │
└────────────┬────────────┘       └─────────────┬───────────────┘
             │                                  │
             ▼                                  ▼
       ┌──────────────────────────────────────────┐
       │ progressService.upsert(...)              │
       │ ↓ Supabase JS                            │
       │ INSERT ... ON CONFLICT (user_id,         │
       │   module_id) DO UPDATE                   │
       │ ↓ trigger user_progress_monotonic        │
       │ ↓ commit                                 │
       └────────────────────┬─────────────────────┘
                            │
                            ▼
       ┌──────────────────────────────────────────┐
       │ TanStack Query invalidates:              │
       │ - keys.progress.byUserAndProduct(...)    │
       │ - keys.modules.byProduct(productId)      │
       └────────────────────┬─────────────────────┘
                            │
                            ▼
       ┌──────────────────────────────────────────┐
       │ useUserProductProgress refetch           │
       │ SELECT * FROM v_user_product_progress    │
       │   WHERE user_id = $auth AND product_id   │
       └────────────────────┬─────────────────────┘
                            │
                            ▼
       ┌──────────────────────────────────────────┐
       │ UI re-renderiza:                         │
       │ - Barra de progresso actualiza           │
       │ - Se progress_percentage >= 90 e         │
       │   sem certificado: mostra botão          │
       │ - Aluno clica "Gerar certificado"        │
       │ - useGenerateCertificate (FDD-004)       │
       └──────────────────────────────────────────┘
```

---

## 5. Implementação

### 5.1 Migration SQL

```sql
-- Trigger de monotonicidade
CREATE OR REPLACE FUNCTION public.user_progress_monotonic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress_percentage := GREATEST(NEW.progress_percentage, OLD.progress_percentage);
  NEW.completed := NEW.completed OR OLD.completed;
  IF NEW.completed AND OLD.completed_at IS NOT NULL THEN
    NEW.completed_at := OLD.completed_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_progress_monotonic_progress ON public.user_progress;
CREATE TRIGGER user_progress_monotonic_progress
BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.user_progress_monotonic();

-- RLS: admin lê progresso de alunos dos seus produtos.
-- A policy existente "Users can manage own progress" já permite ao
-- aluno ler/escrever as suas próprias linhas (auth.uid() = user_id).
-- Esta policy adicional cobre o caso do admin que precisa agregar
-- métricas de alunos nos produtos dos quais é dono.
CREATE POLICY "admins_read_product_progress"
  ON public.user_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.products p ON p.id = m.product_id
      WHERE m.id = user_progress.module_id
        AND p.admin_id = auth.uid()
    )
  );

-- View canónica de progresso por (user_id, product_id)
DROP VIEW IF EXISTS public.v_user_product_progress;

CREATE VIEW public.v_user_product_progress
WITH (security_invoker = on) AS
WITH product_module_counts AS (
  SELECT product_id, COUNT(*) AS modules_total
  FROM public.modules
  GROUP BY product_id
),
user_progress_by_product AS (
  SELECT
    up.user_id,
    m.product_id,
    COUNT(*) FILTER (WHERE up.completed) AS modules_completed,
    MAX(up.completed_at) FILTER (WHERE up.completed) AS completed_at
  FROM public.user_progress up
  JOIN public.modules m ON m.id = up.module_id
  GROUP BY up.user_id, m.product_id
)
SELECT
  upbp.user_id,
  upbp.product_id,
  pmc.modules_total,
  upbp.modules_completed,
  CASE
    WHEN pmc.modules_total = 0 THEN 0
    ELSE ROUND(100.0 * upbp.modules_completed / pmc.modules_total)::INTEGER
  END AS progress_percentage,
  upbp.completed_at
FROM user_progress_by_product upbp
JOIN product_module_counts pmc ON pmc.product_id = upbp.product_id;

GRANT SELECT ON public.v_user_product_progress TO authenticated;
```

### 5.2 Tipos de domínio

A view `v_user_product_progress` não é regenerada como `Tables` em `src/integrations/supabase/types.ts` por padrão; aparece em `Views`. Definir tipo manual em `src/types/domain.ts`:

```typescript
// src/types/domain.ts
import type { Database } from '@/integrations/supabase/types'

export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert']
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update']

export interface UserProductProgress {
  user_id: string
  product_id: string
  modules_total: number
  modules_completed: number
  progress_percentage: number
  completed_at: string | null
}
```

> Após a migration, executar `npx supabase gen types typescript` para regenerar `types.ts`. Se a view aparecer em `Database['public']['Views']`, substituir o `interface` manual por `Database['public']['Views']['v_user_product_progress']['Row']`.

### 5.3 ServiceLayer (`progress.service.ts`)

```typescript
// src/services/progress.service.ts
import { supabase } from '@/integrations/supabase/client'
import type {
  UserProgress,
  UserProductProgress,
} from '@/types/domain'

interface UpsertProgressInput {
  userId: string
  moduleId: string
  progressPercentage: number
  lastPositionSeconds?: number
  completed?: boolean
}

const COMPLETION_THRESHOLD_PCT = 95

export const progressService = {
  async upsert(input: UpsertProgressInput): Promise<UserProgress> {
    const completed =
      input.completed ?? input.progressPercentage >= COMPLETION_THRESHOLD_PCT

    const { data, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: input.userId,
          module_id: input.moduleId,
          progress_percentage: input.progressPercentage,
          last_position_seconds: input.lastPositionSeconds ?? 0,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,module_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async markComplete(userId: string, moduleId: string): Promise<UserProgress> {
    return this.upsert({
      userId,
      moduleId,
      progressPercentage: 100,
      completed: true,
    })
  },

  async getByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<UserProductProgress | null> {
    const { data, error } = await supabase
      .from('v_user_product_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async listModuleProgressByProduct(
    userId: string,
    productId: string,
  ): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*, modules!inner(product_id)')
      .eq('user_id', userId)
      .eq('modules.product_id', productId)

    if (error) throw error
    return (data ?? []) as UserProgress[]
  },
}
```

### 5.4 Hook `useVideoProgress` (YouTube IFrame Player API)

O hook carrega a YouTube IFrame Player API uma única vez por sessão (singleton via promise), instancia um `YT.Player` no `containerRef` fornecido pelo componente, e gere o ciclo de vida via `onStateChange`. Sem nova dependência npm; o script `https://www.youtube.com/iframe_api` é injectado dinamicamente.

`module.video_url` é a URL de embed do YouTube (ex: `https://www.youtube.com/embed/<videoId>`). O hook recebe o `videoId` já extraído pelo componente.

```typescript
// src/hooks/useVideoProgress.ts
import { useEffect, useRef, useCallback } from 'react'
import { progressService } from '@/services/progress.service'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/hooks/queries/keys'

const POLL_INTERVAL_MS = 10_000
const COMPLETION_RATIO = 0.95
const YT_API_SRC = 'https://www.youtube.com/iframe_api'

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiReady: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (youtubeApiReady) return youtubeApiReady
  youtubeApiReady = new Promise((resolve) => {
    if (window.YT?.Player) return resolve()
    const tag = document.createElement('script')
    tag.src = YT_API_SRC
    document.head.appendChild(tag)
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
  })
  return youtubeApiReady
}

interface UseVideoProgressOpts {
  userId: string
  moduleId: string
  productId: string
  videoId: string                                 // extraído de module.video_url
  containerRef: React.RefObject<HTMLDivElement>   // div onde o YT.Player monta o iframe
}

export function useVideoProgress({
  userId,
  moduleId,
  productId,
  videoId,
  containerRef,
}: UseVideoProgressOpts) {
  const queryClient = useQueryClient()
  const playerRef = useRef<any>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSentRef = useRef<{ position: number; pct: number } | null>(null)

  const persist = useCallback(async (forceComplete = false) => {
    const player = playerRef.current
    if (!player || typeof player.getDuration !== 'function') return

    const duration = player.getDuration() ?? 0
    if (!duration || !isFinite(duration) || duration <= 0) return

    const position = Math.floor(player.getCurrentTime() ?? 0)
    const pct = Math.min(100, Math.round((position / duration) * 100))
    const completed = forceComplete || pct / 100 >= COMPLETION_RATIO

    const last = lastSentRef.current
    if (!forceComplete && last && last.position === position && last.pct === pct) return

    try {
      await progressService.upsert({
        userId,
        moduleId,
        progressPercentage: forceComplete ? 100 : pct,
        lastPositionSeconds: position,
        completed,
      })
      lastSentRef.current = { position, pct }
      queryClient.invalidateQueries({
        queryKey: keys.progress.byUserAndProduct(userId, productId),
      })
    } catch (err) {
      console.warn('[useVideoProgress] persist falhou', err)
    }
  }, [userId, moduleId, productId, queryClient])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    pollTimerRef.current = setInterval(() => void persist(), POLL_INTERVAL_MS)
  }, [persist, stopPolling])

  useEffect(() => {
    if (!containerRef.current || !videoId) return
    let cancelled = false

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return
      const PlayerState = window.YT.PlayerState

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            switch (event.data) {
              case PlayerState.PLAYING:
                startPolling()
                break
              case PlayerState.PAUSED:
                stopPolling()
                void persist()
                break
              case PlayerState.ENDED:
                stopPolling()
                void persist(true) // força completed=true e progress=100
                break
              // BUFFERING e CUED: mantém estado actual
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      stopPolling()
      void persist()
      try {
        playerRef.current?.destroy?.()
      } catch {
        // YT.Player.destroy pode lançar se ainda não estava ready
      }
      playerRef.current = null
    }
  }, [videoId, containerRef, startPolling, stopPolling, persist])
}
```

> Sem nova dependência npm. O carregamento da YouTube IFrame API é singleton: a primeira instância do hook injecta o script; as instâncias subsequentes esperam pela mesma promise. `player.destroy()` é envolto em `try/catch` porque a API lança se chamado antes de o player estar `READY`.

### 5.5 Hooks de query (`useProgress.ts`)

```typescript
// src/hooks/queries/useProgress.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { progressService } from '@/services/progress.service'
import { keys } from './keys'
import { toast } from '@/hooks/use-toast'

export const useUserProductProgress = (userId: string, productId: string) =>
  useQuery({
    queryKey: keys.progress.byUserAndProduct(userId, productId),
    queryFn: () => progressService.getByUserAndProduct(userId, productId),
    staleTime: 0, // sempre fresh; muda à medida que o aluno consome
    enabled: !!userId && !!productId,
  })

export const useModuleProgressByProduct = (
  userId: string,
  productId: string,
) =>
  useQuery({
    queryKey: keys.progress.byUserAndProductModules(userId, productId),
    queryFn: () => progressService.listModuleProgressByProduct(userId, productId),
    staleTime: 0,
    enabled: !!userId && !!productId,
  })

interface MarkCompleteVars {
  userId: string
  moduleId: string
  productId: string
}

export const useMarkModuleComplete = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, moduleId }: MarkCompleteVars) =>
      progressService.markComplete(userId, moduleId),
    onSuccess: (_data, { userId, productId }) => {
      queryClient.invalidateQueries({
        queryKey: keys.progress.byUserAndProduct(userId, productId),
      })
      queryClient.invalidateQueries({
        queryKey: keys.progress.byUserAndProductModules(userId, productId),
      })
      toast({
        title: 'Módulo concluído',
        description: 'Progresso registado.',
      })
    },
  })
}
```

### 5.6 Adições a `keys.ts`

```typescript
// src/hooks/queries/keys.ts (excerto a actualizar)
progress: {
  byUserAndProduct: (userId: string, productId: string) =>
    ['progress', 'product', userId, productId] as const,
  byUserAndProductModules: (userId: string, productId: string) =>
    ['progress', 'modules', userId, productId] as const,
},
```

(Substitui a entrada existente no FDD-003 §6.1 por esta versão alargada com chave dedicada para a lista por módulo.)

### 5.7 Refactor das páginas

**`student/ModuleView.tsx` (vídeo):**

```typescript
const containerRef = useRef<HTMLDivElement>(null)
const videoId = useMemo(
  () => extractYoutubeId(module.video_url),
  [module.video_url],
)

useVideoProgress({
  userId: user!.id,
  moduleId: module.id,
  productId: module.product_id,
  videoId,
  containerRef,
})

// JSX:
<div ref={containerRef} className="aspect-video w-full" />

// Helper local (ou em src/lib/youtube.ts):
function extractYoutubeId(url: string | null): string {
  if (!url) return ''
  // Suporta /embed/<id>, watch?v=<id>, /v/<id>, youtu.be/<id>
  const match = url.match(/(?:embed\/|v=|v\/|youtu\.be\/)([^&?\/]+)/)
  return match?.[1] ?? ''
}
```

Remove o `markAsComplete` manual; o hook trata da persistência. O `YT.Player` substitui a `<iframe>` directa actual de `ModuleView.tsx` (linha ~213): a div é o ponto de montagem; o player constrói o iframe internamente com `enablejsapi=1`, permitindo intercepção de estados.

**`student/ModuleView.tsx` (PDF/texto):**

```typescript
const { mutate: markComplete, isPending } = useMarkModuleComplete()

// JSX:
<Button
  onClick={() =>
    markComplete({
      userId: user!.id,
      moduleId: module.id,
      productId: module.product_id,
    })
  }
  disabled={isPending || isCompleted}
>
  Marcar como concluído
</Button>
```

**`student/ProductView.tsx`:**

Substituir o cálculo inline por:

```typescript
const { data: aggregated } = useUserProductProgress(user!.id, productId)
const { data: moduleProgress } = useModuleProgressByProduct(user!.id, productId)

const progressByModuleId = useMemo(
  () => new Map(moduleProgress?.map((p) => [p.module_id, p])),
  [moduleProgress],
)

// Renderização: usa aggregated.progress_percentage para barra global
// e progressByModuleId para o estado de cada módulo
```

**`student/Certificate.tsx`:**

Substituir o cálculo inline (`fetchModules` → `userProgress` → `(completed/total)*100`) por leitura directa da view:

```typescript
const { data: progress } = useUserProductProgress(user!.id, productId)
const { data: certificate } = useCertificate(user!.id, productId)
const { mutate: generate, isPending } = useGenerateCertificate()

const eligible = (progress?.progress_percentage ?? 0) >= 90
const hasCertificate = !!certificate?.pdf_url
```

UI: empty state se `progress < 90`; botão "Gerar certificado" se `eligible && !hasCertificate`; botão "Baixar" se `hasCertificate`.

**`student/Dashboard.tsx`:**

Onde itera produtos comprados, fazer JOIN com `useUserProductProgress` por produto (uma query por produto na lista; cache TanStack Query agrupa).

**`admin/Dashboard.tsx`:**

Para métricas agregadas por admin, consultar `v_user_product_progress` filtrando por `product_id` dos produtos do admin. A policy `admins_read_product_progress` introduzida em §5.1 desbloqueia este SELECT: admin lê linhas de `user_progress` de qualquer aluno desde que o `module_id` pertença a um produto cujo `admin_id = auth.uid()`. A view herda automaticamente esta policy via `security_invoker = on`.

---

## 6. Tratamento de erros

### 6.1 Cenários no player de vídeo (YouTube IFrame API)

| Cenário | Comportamento |
|---|---|
| `loadYouTubeApi()` falha (network bloqueia `youtube.com/iframe_api`) | `loadYouTubeApi` rejeita; `YT.Player` nunca instanciado; persist nunca dispara. UI continua a mostrar o vídeo via fallback `<iframe>` se implementado, mas tracking fica desabilitado |
| `player.getDuration()` retorna 0 ou `Infinity` (player ainda não READY) | Persist é ignorado; próximo polling tenta de novo |
| `videoId` extraído da URL é vazio (URL malformada em `module.video_url`) | useEffect early-return; player não é construído; nenhum tracking |
| Persist em polling falha (network/RLS) | `console.warn`; próximo intervalo tenta de novo. Não interrompe playback. |
| Persist em `PAUSED` ou `ENDED` falha | `console.warn`; aluno perde até ~10 s de progresso até reabertura |
| Persist em unmount falha | Última posição perdida; aluno revê do último persist bem-sucedido |
| Aluno fecha aba bruscamente | Cleanup do useEffect pode não correr. v1.0 aceita perda até 10 s desde último persist. Alvo v1.x: handler `beforeunload` com `navigator.sendBeacon` |
| Vídeo aberto em duas abas | UPSERT atómico + trigger de monotonicidade asseguram que progresso não regride; `last_position_seconds` reflecte última escrita |
| YouTube remove ou marca o vídeo como privado depois de já ter sido configurado pelo admin | Player constrói mas dispara `onError`; tracking parte como zero. Decisão de produto (não tratada neste FDD): admin recebe alerta para reupload/troca de URL |

### 6.2 Cenários em `markComplete`

| Cenário | Comportamento |
|---|---|
| RLS bloqueia (utilizador errado) | Erro propaga; toast destrutivo via `onError` global |
| UPSERT falha por DB lock momentâneo | Retentável pelo aluno via novo clique |
| Aluno marca módulo já marcado | UPSERT é idempotente; trigger preserva `completed_at` original |

### 6.3 Cenários na view `v_user_product_progress`

| Cenário | Comportamento |
|---|---|
| Utilizador sem nenhum progresso para o produto | View não retorna linha; `getByUserAndProduct` retorna null; UI mostra 0% |
| Produto sem módulos | `modules_total = 0`; CASE retorna `progress_percentage = 0`; certificado nunca elegível |
| Módulo apagado depois de completo | LEFT JOIN no produto: `modules_total` reduz; `progress_percentage` recalcula automaticamente |

---

## 7. Restrições e Regras

1. ServiceLayer (`progressService`) é o único caminho do frontend para escrever em `user_progress`. Páginas não chamam `supabase.from('user_progress')` directamente.
2. `v_user_product_progress` é a única fonte de verdade para progresso agregado. Páginas e Edge Functions consomem esta view; nunca recalculam inline.
3. Toda escrita em `user_progress` usa `.upsert({ onConflict: 'user_id,module_id' })`. SELECT + INSERT/UPDATE manual está banido.
4. Trigger SQL `user_progress_monotonic_progress` está activo; cliente pode confiar que `progress_percentage` e `completed` nunca regridem.
5. `last_position_seconds` pode decrescer livremente (representa posição actual, não máxima).
6. Polling de 10 s enquanto YouTube `PLAYING`. Estados terminais (`PAUSED`, `ENDED`, unmount) persistem imediatamente sem polling. Vídeos são YouTube embeds via `YT.Player`; o iframe é construído pela API a partir de um div container.
7. View criada com `security_invoker = on`. Trocar este flag introduz risco crítico de RLS bypass (Risco P6).
8. Trigger client-driven do certificado em v1.0; aluno clica explicitamente.

---

## 8. Riscos

| ID | Risco | Probabilidade | Impacto | Mitigação | Plano de contingência |
|---|---|---|---|---|---|
| P1 | View `v_user_product_progress` lenta com escala (alunos × módulos × produtos) | Baixa em v1.0 | Médio | Índice `UNIQUE(user_id, module_id)` em `user_progress` já existe; adicionar índice `modules(product_id)` se ausente; monitorar p95. **Threshold de revisão:** > 100 k linhas em `user_progress` ou p95 de leitura > 200 ms | Materializar a view com refresh periódico ou via trigger após UPDATE em `user_progress` |
| P2 | Aluno fecha aba bruscamente; cleanup do useEffect não corre | Média | Baixo (perde até 10 s desde último persist) | v1.0 aceita perda. Eventos `pause` e `ended` cobrem os casos normais. **Alvo v1.x:** handler `beforeunload` com `navigator.sendBeacon` apontando para Edge Function dedicada que faz UPSERT | Aceitar perda; aluno retoma a partir do último persist bem-sucedido |
| P3 | YouTube IFrame Player API não carrega ou `player.getDuration()` retorna 0 antes de `READY` | Média | Médio (tracking não regista sessão completa) | Validar `duration > 0 && isFinite(duration)` antes de persistir; loadYouTubeApi é singleton com fallback de retry implícito em re-mounts | Para vídeos onde a API persistentemente falha, expor flag de "marcar manualmente" no UI; logging em Sentry para detectar bloqueios sistémicos (corporate firewalls, ad-blockers agressivos) |
| P4 | Disciplina de monotonicidade falha no cliente (regressão por seek-back) | Média se não houver trigger DB | Baixo | Trigger SQL `user_progress_monotonic` aplica `GREATEST` no servidor; cliente pode enviar valor menor sem efeito | Não aplicável (trigger resolve) |
| P5 | UPSERT race entre duas abas para o mesmo módulo | Baixa | Baixo | UNIQUE + trigger de monotonicidade resolvem; aluno percebe `last_position_seconds` da última escrita mas progress_percentage e completed não regridem | Aceitar como esperado |
| P6 | View criada sem `security_invoker = on` em PG <15 ou por engano | Baixa | Crítico (vazamento entre alunos) | Migration explícita `WITH (security_invoker = on)`; teste manual com 2 contas de aluno em staging confirma filtro RLS | Drop view e recriar; auditar logs Supabase de SELECTs |
| P7 | Policy `admins_read_product_progress` mal escrita causa vazamento entre admins | Baixa | Crítico (admin A vê alunos de admin B) | Policy especifica `EXISTS` com `JOIN` em `modules` + `products` filtrando `p.admin_id = auth.uid()`; teste manual com 2 contas de admin em staging confirma isolamento por produto | Drop policy e recriar; auditar logs Supabase; revogar acesso temporário ao painel admin se vazamento confirmado |

---

## 9. Plano de Migração

### 9.1 Pré-condições

- ✅ FDD-003 ServiceLayer aprovado
- ✅ FDD-004 Geração de Certificado aprovado (consome `v_user_product_progress`)

Sem novas dependências de runtime. O debounce do player é inline com `useRef + setTimeout`.

### 9.2 Sequência de PRs

**PR 1 — Migration SQL** *(sem código de aplicação)*
- View `v_user_product_progress` com `security_invoker = on`
- Trigger `user_progress_monotonic_progress`
- GRANT SELECT a `authenticated`
- Adicionar a `EXECUTAR_NO_SUPABASE.sql` ou criar migration em `supabase/migrations/` (alvo ADR-012)
- Regenerar `types.ts` se necessário
- Validação: SELECT por aluno em staging mostra apenas suas linhas; SELECT por outro aluno retorna 0

**PR 2 — ServiceLayer + types** *(sem alteração de UI)*
- `src/services/progress.service.ts`
- `src/types/domain.ts` — adicionar `UserProductProgress`
- `src/hooks/queries/keys.ts` — actualizar `progress.*` keys
- `src/hooks/queries/useProgress.ts`

**PR 3 — Hook `useVideoProgress` + refactor `ModuleView`**
- `src/hooks/useVideoProgress.ts` (debounce inline com `useRef + setTimeout`; sem nova lib)
- Refactor de `student/ModuleView.tsx`:
  - Vídeo: usa `useVideoProgress`; remove `markAsComplete` manual
  - PDF/texto: usa `useMarkModuleComplete`
- Validação manual: completar vídeo → verificar `progress_percentage` em DB; pause/seek/refresh persistem `last_position_seconds`

**PR 4 — Refactor `ProductView` e `student/Dashboard`**
- Substituir cálculo inline por `useUserProductProgress` e `useModuleProgressByProduct`
- Validação: barras de progresso UI batem com SELECT da view

**PR 5 — Refactor `Certificate.tsx`**
- Trocar cálculo de progresso pelo `useUserProductProgress`
- Manter integração com `useGenerateCertificate` (FDD-004)
- Estados: empty < 90; botão gerar quando >= 90 e sem cert; botão baixar quando cert existe

**PR 6 — Refactor `admin/Dashboard.tsx`**
- Trocar agregações inline por SELECT em `v_user_product_progress`
- Pré-condição cumprida: policy `admins_read_product_progress` foi aplicada no PR 1
- Validação manual com duas contas de admin diferentes confirma isolamento por produto (Risco P7)

### 9.3 Coordenação com FDD-004

Após PR 1 deste FDD em produção, a função `readAggregatedProgress` da Edge Function `generate-certificate` (FDD-004 §5.2) deve ser actualizada para ler directamente de `v_user_product_progress`:

```typescript
async function readAggregatedProgress(client, userId, productId) {
  const { data, error } = await client
    .from('v_user_product_progress')
    .select('progress_percentage')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()
  if (error) throw error
  return data?.progress_percentage ?? 0
}
```

Isto remove a consolidação inline temporária do FDD-004 e cumpre o contracto declarado em FDD-004 §3.4.

### 9.4 Validação

Cobertura manual em staging:
- Vídeo: timeupdate persiste com debounce; pause persiste imediato; ended marca completed=true; refresh recupera `last_position_seconds`
- PDF/texto: botão marca completed=true; clique repetido é idempotente
- Vídeo aberto em 2 abas: progresso máximo prevalece; `last_position_seconds` reflecte última escrita
- Seek para o início e re-play: progress_percentage não regride (trigger valida)
- View: aluno A vê apenas as suas linhas; aluno B não vê linhas de A
- Página `Certificate.tsx`: < 90% mostra empty; >= 90% mostra botão; clique gera cert; refresh mostra botão baixar
- Página `student/Dashboard.tsx`: barras de progresso batem com cálculo manual SELECT
- Página `admin/Dashboard.tsx`: admin A vê progresso agregado dos alunos dos **seus** produtos; admin A não vê linhas de produtos do admin B (isolamento da policy `admins_read_product_progress`)

---

## 10. Próximos Passos

1. Aplicar migration SQL (PR 1) em staging; validar RLS por dois utilizadores
2. Implementar PR 2 (ServiceLayer + types + hooks queries)
3. Implementar PR 3 (hook de vídeo + refactor ModuleView); validar fluxo de vídeo end-to-end
4. Implementar PR 4 (ProductView + student/Dashboard)
5. Implementar PR 5 (Certificate.tsx); coordenar com FDD-004 PR 2 (Edge Function consome view)
6. Implementar PR 6 (admin/Dashboard); validar RLS de admin
7. Após FDD-004 deployar com a leitura via view, remover dívida temporária da consolidação inline (FDD-004 §5.2)
8. Avaliar critério de materialização da view (Risco P1) após primeiros 3 meses de produção real

---

*FDD gerado após confirmação das decisões D1 (granularidade real para vídeo, binária para PDF/texto), D2 (% módulos completos como agregado), D3 (view SQL `v_user_product_progress` como fonte canónica), D4 (trigger client-driven em v1.0), D5 (`.upsert` com onConflict) e D6 (debounce 10 s + persist obrigatório em pause/ended/unmount) com o user. Todas as decisões foram tomadas de forma colaborativa antes da redacção.*

*Correcções aplicadas na revisão: (1) policy RLS `admins_read_product_progress` adicionada explicitamente em §5.1 como pré-condição do PR 6, fechando o gap apontado no Risco P8 da versão inicial; (2) hook `useVideoProgress` substituiu `use-debounce` por implementação inline com `useRef + setTimeout` para evitar nova dependência (§5.4); (3) `beforeunload + sendBeacon` formalmente declarado fora de âmbito v1.0 e movido para alvo v1.x (§3.6, §6.1, Risco P2). Tabela de riscos renumerada após remoção de P7 (use-debounce, agora não aplicável) e re-ocupação por novo P7 (vazamento entre admins via policy mal escrita).*

*Revisão posterior (sincronização YouTube embeds): vídeos em v1.0 são YouTube embeds (não Storage Supabase). `useVideoProgress` foi reescrito de HTML5 `<video>` element para YouTube IFrame Player API (§5.4): polling com `setInterval` enquanto `YT.PlayerState.PLAYING`, persist imediato em `PAUSED` e `ENDED`, singleton de carregamento da API. §3.1, §3.6, §5.7, §6.1 e Risco P3 actualizados em consonância. ModuleView passa a montar `YT.Player` numa `<div>` em vez de `<video src={signedUrl}>`. Sincronização paralela em FDD-003 §5.5 (remove `getVideoSignedUrl`), HLD §137/§161/§323/Risco 8 (vídeos fora do perímetro de Storage privado), CLAUDE.md (clarifica `module-content` para PDFs) e EXECUTAR_NO_SUPABASE.sql (comentário em `modules.video_url`).*
