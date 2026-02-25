# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:8080
npm run build     # production build
npm run build:dev # development build
npm run lint      # ESLint
npm run preview   # preview production build
```

No test suite is configured in this project.

## Architecture

### Overview
SaaS multi-tenant platform for online courses (similar to Hotmart/Kiwify). Two user personas: **admins** (create and manage products/modules) and **students** (consume purchased content). There is no organization/tenant table — each admin owns their products directly via `admin_id`.

### Auth & Role System
Auth is handled by Supabase Auth. On signup, a PostgreSQL trigger (`handle_new_user`) creates a row in `public.profiles` and assigns `role = 'user'` in `public.user_roles`.

`src/hooks/useAuth.tsx` exports `AuthProvider`, `useAuth`, and `ProtectedRoute`. The `ProtectedRoute` component fetches `user_roles` at render time and redirects based on role. The `/auth/signup` page additionally promotes new registrants to `'admin'` role via a client-side update after signup — this is intentional (admin self-registration flow).

Roles drive routing:
- `'admin'` → `/admin/*` (wrapped in `AdminLayout`)
- `'user'` → `/student/*`

### Data Flow
All Supabase queries go through the typed client at `src/integrations/supabase/client.ts` (auto-generated — do not edit). Database types live in `src/integrations/supabase/types.ts` (also auto-generated). Pages use TanStack Query (`useQuery`/`useMutation`) for data fetching and caching; direct `supabase` calls are made inside query functions.

### Database Schema
Key tables and their ownership rules:

| Table | Owner/Access |
|-------|-------------|
| `profiles` | User owns their own row (RLS: `auth.uid() = id`) |
| `user_roles` | User reads own row; role values: `'admin'` \| `'user'` |
| `products` | Admin owns via `admin_id`; students can SELECT active ones |
| `modules` | Accessible if `is_preview = true` OR user has approved purchase |
| `purchases` | Status: `pending` / `approved` / `cancelled` / `refunded` |
| `user_progress` | User owns; tracks `progress_percentage` and `last_position_seconds` |
| `certificates` | Generated on course completion; unique per `(user_id, product_id)` |

### Edge Functions (`supabase/functions/`)
Serverless Deno functions for: payment webhook ingestion (`webhook-payment`), payment processing (`process-payment`), checkout creation (`create-checkout`), email confirmation (`send-purchase-confirmation`), notifications (`send-notification`), and certificate PDF generation (`generate-certificate`).

Payment webhooks from Hotmart, Kiwify, and Monetizze all route through `webhook-payment`.

### UI Layer
Components in `src/components/ui/` are shadcn/ui components — do not modify them directly; regenerate via `shadcn` CLI if needed. Custom components live in `src/components/admin/` and `src/components/student/`. The `@/` path alias resolves to `src/`.

### Currently Disabled
Checkout and landing page routes are commented out in `src/App.tsx`. The checkout flow (Stripe, Mercado Pago, PIX) is not yet implemented.

## Database Setup

To reset the database from scratch, run `EXECUTAR_NO_SUPABASE.sql` in the Supabase SQL Editor. To promote an existing user to admin, run `CRIAR_ADMIN.sql` (edit the email first) or:

```sql
UPDATE public.user_roles SET role = 'admin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'your@email.com');
```

After running the SQL setup, create two Storage buckets in Supabase: `product-images` and `module-content` (both public).
