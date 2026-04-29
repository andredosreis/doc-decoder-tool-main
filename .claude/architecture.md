# Architecture context — APP XPRO

Detailed context that the root `CLAUDE.md` points to. Read the relevant section before doing the work it covers.

---

## Auth & Authorization

- Supabase Auth handles signup, login, recovery. PostgreSQL trigger `handle_new_user` creates a `public.profiles` row and sets `role = 'user'` in `public.user_roles` on signup.
- `src/hooks/useAuth.tsx` exports `AuthProvider`, `useAuth`, `ProtectedRoute`. **`ProtectedRoute` redirects by role but has no security effect** (ADR-003); RLS is the only real authorization layer.
- Role routing: `'admin'` → `/admin/*` (wrapped in `AdminLayout`); `'user'` → `/student/*`.
- **Known vulnerability:** `/auth/signup` does a client-side UPDATE in `user_roles` to promote new registrants to `'admin'` (HLD Risk 2). Fix specified in ADR-004 + FDD-001 (`promote_to_admin SECURITY DEFINER` + Edge Function `promote-admin` for bootstrap). Do not extend or rely on the v0 flow; treat it as deprecated.

## Multi-tenant model

Tenant = admin (ADR-002). Ownership chain via FK:

```
products.admin_id  →  modules.product_id  →  user_progress.module_id
                  →  purchases.product_id (and .user_id for the student)
                  →  certificates.product_id (and .user_id for the student)
```

RLS enforces isolation per row. The application layer never duplicates this check. See ADR-003 for the defense-in-depth layering.

## ServiceLayer (in progress)

- **Today:** pages call `supabase` directly via `src/integrations/supabase/client.ts`.
- **Target (ADR-008 + FDD-003):** every query passes through `src/services/<domain>.service.ts` (products, modules, purchases, progress, certificates, notifications, auth, storage). Pages and hooks consume the service; never `supabase` directly.
- **Migration state:** PRs 0–6 of FDD-003 are sequenced; pages still talking to Supabase directly are temporarily acceptable. The "no direct Supabase outside `src/services/`" rule activates **only after PR 6 is merged**.

## Edge Functions (`supabase/functions/`)

All Deno runtime. Versioning policy (ADR-010): a breaking change in a public function creates `<name>-v2`; internal-only functions refactor in place.

| Function | Purpose |
|---|---|
| `webhook-payment` | Ingests payment webhooks from Hotmart, Kiwify, Monetizze, Eduzz, Stripe (validator plugin architecture; FDD-002) |
| `process-payment` | Internal call from `webhook-payment` |
| `create-checkout` | Stripe checkout session (currently disabled in `App.tsx`) |
| `send-purchase-confirmation` | Resend e-mail after approved purchase |
| `send-notification` | In-app notification via Realtime; called by other Edge Functions |
| `generate-certificate` | Functionally incomplete in v0 (writes row but leaves `pdf_url` NULL); FDD-004 specifies the rewrite (`pdf-lib` + signed URL TTL 300 s + idempotent retry) |
| `admin-invite-student` | Sends magic link via `auth.admin.createUser` |

## Storage buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `product-images` | public | Cover images for products |
| `module-content` | private | **PDFs only.** Signed URL TTL 3600 s |
| `certificates` | private | Certificate PDFs. Signed URL TTL 300 s. **Bucket does not yet exist; FDD-004 PR 1 creates it with the proper RLS** |
| `avatars`, `logos` | public | User avatars and creator logos |

**Videos are NOT in Storage.** `modules.video_url` stores a YouTube embed URL (e.g. `https://www.youtube.com/embed/<id>`); rendered directly via `<iframe>` in `student/ModuleView.tsx`. FDD-005 documents the YouTube IFrame Player API integration for progress tracking.

## Database schema

Run `EXECUTAR_NO_SUPABASE.sql` in the Supabase SQL Editor to bootstrap from scratch.

| Table | Access |
|---|---|
| `profiles` | `auth.uid() = id` |
| `user_roles` | User reads own row; UPDATE by user is blocked (privilege escalation defense, ADR-004) |
| `products` | Admin owns via `admin_id`; students SELECT active ones |
| `modules` | Accessible if `is_preview = true` OR user has approved purchase |
| `purchases` | Status: `pending` / `approved` / `cancelled` / `refunded`. Webhook idempotency requires `UNIQUE(external_transaction_id)` (ADR-005); **constraint not yet applied** |
| `user_progress` | User owns; has `progress_percentage` and `last_position_seconds`. Trigger `user_progress_monotonic` (FDD-005) prevents regression of `progress_percentage` and `completed` |
| `certificates` | UNIQUE `(user_id, product_id)`; generated on course completion |
| `webhook_logs` | TTL 30 days; admin reads logs for own products (FDD-002) |

**Migration tooling:** v1.0 uses the single `EXECUTAR_NO_SUPABASE.sql` script. ADR-012 records the target of moving to versioned `supabase/migrations/` via Supabase CLI — pending.

To promote an existing user to admin during development, run `CRIAR_ADMIN.sql` (edit the email first) or:

```sql
UPDATE public.user_roles SET role = 'admin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'your@email.com');
```

## Documentation framework navigation

Detailed design lives in `.claude/docs/`. The canonical chain when working on a feature:

1. The relevant **FDD-\*.md** for the feature design contract
2. **SDD.md** if the change touches auth, RLS, secrets, or PII
3. **`adrs/generated/{MODULE}/ADR-*.md`** for architectural decisions that constrain implementation
4. **RUNBOOKS.md** before any destructive op (migration, secret rotation, restore)

| File | Purpose |
|---|---|
| `PRD.md` | Product requirements |
| `HLD.md` | High-Level Design (architecture, flows, data model, risks, ADR list) |
| `FDD-promocao-admin.md` | Admin self-registration via SECURITY DEFINER + bootstrap token + hCaptcha |
| `FDD-webhook-pagamento.md` | Validator plugin architecture for payment webhooks |
| `FDD-service-layer.md` | ServiceLayer pattern + migration plan PRs 0–6 |
| `FDD-geracao-certificado.md` | Certificate PDF generation (`pdf-lib` + Storage + signed URL) |
| `FDD-progresso-certificacao.md` | Progress tracking via SQL view + YouTube IFrame Player API |
| `FDD-pwa-shell.md` | PWA configuration (Workbox, install prompt, offline fallback) |
| `adrs/generated/{MODULE}/ADR-001..012-*.md` | 12 ADRs with bidirectional links |
| `adrs/reports/` | adr-link relationship reports |
| `mermaid/*-diagrams.md` | Mermaid diagrams per FDD (render natively in GitHub and VS Code) |
| `SDD.md` | Security Design Doc (threat model, RLS policies, IR scenarios, LGPD, pending matrix) |
| `RUNBOOKS.md` | 7 IR scenarios + 7 common ops (deploys, migrations, restores, secret rotation) |
| `TypeScript-development-guidelines.md` | Coding guidelines |

## Known constraints (do not re-propose as new solutions)

These items are documented and on the roadmap. Confirm before duplicating work.

1. **Privilege escalation in `Signup.tsx`** — fix specified in ADR-004 + FDD-001 (`promote_to_admin SECURITY DEFINER` + Edge Function `promote-admin` for bootstrap)
2. **`UNIQUE(external_transaction_id)` on `purchases`** — required for webhook idempotency (ADR-005); apply via migration before first real webhook
3. **Webhook secret per-product** — current state is the global env var `WEBHOOK_SECRET`; target is `products.webhook_secret` per product (HLD Risk 3)
4. **Bucket `certificates`** — created by FDD-004 PR 1 with three RLS policies on `storage.objects`
5. **Sentry SDK** — not yet installed; ADR-009 fixes config (`tracesSampleRate: 0.1`, `sendDefaultPii: false`, `beforeSend` scrubs PII)
6. **CSP, `X-Frame-Options: DENY`, CORS by domain** — closed in SDD §9 / §11; configuration to apply at host level (Vercel/Netlify) and on Edge Functions
7. **Soft-delete in `products` and `modules`** — not implemented (HLD Risk 10); UI must double-confirm before DELETE until then
8. **`generate-certificate` Edge Function is incomplete** — rewrite per FDD-004 (the v0 row insert leaves `pdf_url` NULL)
9. **Plano Supabase Pro** is the production target (Free tier CPU limit of 50 ms is incompatible with `generate-certificate`)

## Currently disabled features

Checkout and landing page routes are commented out in `src/App.tsx`. The full checkout flow (Stripe, Mercado Pago, PIX) is not yet implemented.

## House writing rules for documentation

When authoring or modifying documents under `.claude/docs/`:

- No long em-dashes (`—`); use colon, semicolon, comma, parentheses, or period
- No decorative emojis; technical markers `⚠️`, `✅`, `⏳` are allowed for tracking
- Always distinguish current state vs target state ("Estado actual: X. Estado alvo: Y") so the document remains useful in incidents
- Risks always structured: probabilidade / impacto / mitigação / plano de contingência
- Tech debts always carry priority + justification + activation criterion
- Languages mixed pt-PT / pt-BR are acceptable; do not normalize
