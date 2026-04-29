# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

APP XPRO is a SaaS multi-tenant platform for online courses (Hotmart/Kiwify-like). Two personas: **admins** create products and modules; **alunos** consume purchased content. There is no `organizations` table; each admin owns their products directly via `admin_id`. The repository directory is `doc-decoder-tool` but the product is APP XPRO.

## Stack

- React 18 + TypeScript + Vite 5 + Tailwind CSS + shadcn/ui (frontend)
- TanStack Query v5 (sole server-state cache; no Redux/Zustand)
- React Router v6, React Hook Form + Zod
- Supabase: Auth + PostgreSQL with RLS + Storage + Edge Functions (Deno runtime)
- Resend (email, called from Edge Functions)
- `vite-plugin-pwa@1.2.0` (configured)

`@/` path alias → `src/`.

## Commands

```bash
npm run dev        # http://localhost:8080
npm run build      # production build
npm run build:dev  # development-mode build
npm run lint       # ESLint (append `-- --fix` to autofix)
npm run preview    # preview production build
```

No test suite is configured.

## Folder structure

```
src/
  pages/                   # routed pages (admin/, student/, auth/)
  components/
    ui/                    # shadcn/ui generated; do not edit by hand
    admin/  student/       # role-specific custom components
  hooks/
    useAuth.tsx            # AuthProvider + ProtectedRoute (UX redirect, NOT a security boundary)
    queries/               # TanStack Query hooks per domain
  integrations/supabase/   # client + types (auto-generated; do not edit)
  services/                # ServiceLayer per domain (in progress; FDD-003)
  types/  lib/

supabase/functions/        # Deno Edge Functions

.claude/
  docs/                    # PRD, HLD, FDD-*, ADR-*, SDD, RUNBOOKS, mermaid/, adrs/
  architecture.md          # context for any non-trivial work; read first (see below)
```

## Universal rules

- **`src/components/ui/` is shadcn/ui generated**; never edit by hand. Regenerate via `npx shadcn add <component>`.
- **`src/integrations/supabase/{client.ts,types.ts}` is auto-generated**; never edit. Types regenerate via `npx supabase gen types typescript`.
- **Videos are NOT in Supabase Storage.** `modules.video_url` is a YouTube embed URL rendered directly via `<iframe>`; there is no `getVideoSignedUrl`. Why this matters: it is a recurring assumption mistake; checking the schema would not reveal it.
- **`ProtectedRoute` is UX-only.** RLS in PostgreSQL is the sole authorization mechanism. Never add auth checks in React expecting them to enforce access; add the equivalent RLS policy instead.
- **Auto-generated files are listed above.** If a generator output looks wrong, fix the generator input or the regen command, not the output.

## When to read each context file

The detailed architecture, documentation framework navigation, known constraints, and writing rules live in `.claude/architecture.md`. Read it **before**:

- Touching auth, RLS, roles, `user_roles`, or `Signup.tsx` (privilege escalation context)
- Adding or modifying tables, RLS policies, triggers, or migrations
- Working in `src/services/`, the ServiceLayer migration, or any TanStack Query hook
- Working on Edge Functions in `supabase/functions/`
- Working with Storage buckets, signed URLs, or certificate generation
- Proposing a solution to webhook idempotency, observability, CORS, or any item that may already be on the roadmap (the file documents what is pending so you do not duplicate effort)
- Authoring or modifying documents under `.claude/docs/` (writing rules section)
