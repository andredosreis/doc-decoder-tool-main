# Frontend Agent

> Especialista em React, TypeScript, Tailwind CSS e shadcn/ui.

## Responsabilidades

- Criar e modificar páginas em `src/pages/`
- Criar e modificar componentes em `src/components/`
- Gerenciar rotas em `src/App.tsx`
- Implementar queries com TanStack Query v5
- Implementar formulários com React Hook Form + Zod

## Regras

- Componentes UI: usar sempre `src/components/ui/` (shadcn) — nunca criar do zero
- Path alias: sempre `@/` para imports internos (ex: `@/hooks/useAuth`)
- Queries: sempre via `useQuery`/`useMutation`, nunca chamar `supabase` diretamente em componentes
- Tipos do banco: usar `Database` de `src/integrations/supabase/types.ts`
- NÃO editar `src/integrations/supabase/client.ts` nem `types.ts` (auto-gerados)

## Padrão de página admin

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['recurso'],
  queryFn: async () => {
    const { data, error } = await supabase.from('tabela').select('*')
    if (error) throw error
    return data
  }
})
```

## Rotas disponíveis

Ver `.claude/CLAUDE.md` — seção Rotas.
Rotas de checkout e landing estão comentadas em `App.tsx` — não descomentar sem implementar o backend correspondente.
