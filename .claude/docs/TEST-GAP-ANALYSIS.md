# Test Gap Analysis — APP XPRO

**Date:** 2026-04-29
**Method:** parallel multi-agent code review (6 agents, 6 scopes), focused on edge cases, sad paths, error handling, rate limiting, security boundaries, and race conditions. Happy paths intentionally skipped.

---

## Status quo

- **Zero tests exist.** No `*.test.*`, no `*.spec.*`, no test runner installed (no vitest, jest, playwright, deno test setup).
- `package.json` has no `"test"` script.
- This is a gap analysis from scratch, not an audit of existing tests.

---

## Aggregate count

| Area | Layer | Tests proposed |
|---|---|---|
| Auth flows (Signup, Login, Reset, useAuth, ProtectedRoute) | Frontend | **22** |
| Admin pages (Products, Modules, Customers, Users, Dashboard, Purchases, Settings) | Frontend | **30** |
| Student pages (Dashboard, ProductView, ModuleView, Certificate) | Frontend | **28** |
| Edge Functions (7 functions in `supabase/functions/`) | Backend | **50** |
| Database / RLS / triggers / functions / views | Backend (DB) | **35** |
| Cross-cutting (lib, hooks, components, queryClient, sanitization) | Frontend | **24** |
| **TOTAL** | | **189** |

**Frontend:** 104 tests  
**Backend:** 85 tests  
**Split:** ~55% frontend, ~45% backend (but the 50 Edge Function tests are individually high-value because they cover money flow and auth boundaries).

---

## Distribution by category

| Category | Tests | Why this category matters |
|---|---|---|
| Security / authorization | 38 | Privilege escalation, cross-tenant access, signature validation, role boundaries |
| Cross-tenant RLS isolation | 14 | RLS is the only authorization layer; gaps here are crítical |
| Idempotency / race conditions | 18 | Webhook replays, concurrent writes, double-clicks, monotonicity |
| Error handling — external services | 14 | Resend timeouts, Supabase 500s, Stripe down |
| Input validation / payload edge cases | 27 | Malformed webhook payloads, form validation gaps, prototype pollution |
| Sanitization / injection (XSS) | 8 | DOMPurify config, javascript: URLs, video_url validation |
| Constraint enforcement | 8 | UNIQUE / CHECK / FK behavior, off-by-one boundaries |
| Trigger behavior | 6 | handle_new_user, monotonicity, set_updated_at |
| Function behavior (SECURITY DEFINER) | 6 | has_role, promote_to_admin, generate_certificate_number |
| Cache / state consistency | 6 | TanStack Query invalidation, optimistic UI |
| Component robustness | 5 | Empty states, image fallbacks, divide-by-zero |
| Routing / protected boundaries | 4 | ProtectedRoute race, fallback routes |
| View security and cascade | 9 | v_user_product_progress edge cases, ON DELETE CASCADE chains |
| Formatting / locale | 5 | Brazilian comma decimal, currency, duration display |
| Edge cases / boundary | 21 | Empty product, deleted entities, expired purchases, NULL handling |
| **TOTAL** | **189** | |

---

## Critical production bugs surfaced (separate from test plan)

These are real bugs the agents found in the production code while doing the analysis. Each warrants a fix independent of testing.

### Backend (Edge Functions + DB)

1. **`send-purchase-confirmation/index.ts:141,145`** references `purchase.product_id` and `purchase.user.id` that are NOT in the `.select()`. Latent runtime bug; will throw on first execution.
2. **`process-payment/index.ts:78-85`** swallows role-update error and returns success — a paying admin gets `'user'` role. **Money loss / customer-facing bug.**
3. **`create-checkout/index.ts:70`** stores plaintext password in Stripe metadata. **Compliance / security violation.**
4. **`webhook-payment/index.ts:217`** `.or()` query with potentially-undefined values can match unrelated rows; also no tenant isolation on product lookup → cross-tenant grant via webhook.
5. **`webhook-payment/index.ts:236-241`** refund flow nulls `approved_at`, losing original timestamp (audit hole).
6. **`admin-invite-student/index.ts:191-208`** does NOT validate that `product_id` belongs to the inviting admin → admin A can grant access to admin B's product.
7. **`generate-certificate/index.ts:170-174`** random 6-digit cert number is collision-prone (~1200 certs/year). FDD-004 already specifies the fix.
8. **`import_map.json` is bypassed**: `process-payment` and `create-checkout` import `@supabase/supabase-js@2.57.2` directly instead of using the pinned `@2.38.4`.
9. **Storage policy in migration `20251001120424_*.sql:24`** omits `expires_at` check that exists on the `modules` table — direct Storage access bypasses temporal gate.
10. **Storage policy uses `LIKE '%' || storage.objects.name || '%'`** — substring matching on attacker-controlled filenames (privilege escalation vector).
11. **RLS policies use `FOR ALL ... USING` without `WITH CHECK`** on `products`, `modules`, `user_progress` — UPDATE-rebind hijack class needs explicit guard.

### Frontend (Auth + Admin + Student)

12. **`Login.tsx:69`** default-branch routes to `/admin/dashboard` when role lookup fails — student can land on admin URL (UI breaks but is a poor failure mode).
13. **`Signup.tsx:81-100`** uses 1-second `setTimeout` to coordinate with `handle_new_user` trigger; on slow DB, the UPDATE matches 0 rows silently and the user keeps `'user'` role while toast says they're admin.
14. **`useAuth.tsx:43-47`** `signOut` only clears local state after `await` resolves — if API call throws, UI keeps user "logged in".
15. **`ProductForm.tsx:67-72,79`** + **`ModuleForm.tsx:102-104`**: `file.name.split('.').pop()` for storage path — vulnerable to filename traversal (`../`, null bytes).
16. **`ProductForm.tsx:78`** + **`ModuleForm.tsx:152,156`**: `dompurify` exists in deps but neither form invokes it before DB insert. Stored XSS surface.
17. **`Purchases.tsx:174-176,284`** falsy-zero bug: `(p.amount_paid || p.product.price || 0)` → free purchases (amount_paid=0) report wrong revenue.
18. **`Customers.tsx:39-57`** aggregation Map only updates `total_courses` on second-and-later purchases; `last_purchase` never updates.
19. **`Dashboard.tsx:9-124`** 7+ sequential queries with no `Promise.allSettled`; one failure blanks the whole dashboard.
20. **`useNotifications.tsx:33,58`** Realtime channel name not user-scoped; `unsubscribe()` creates a new channel reference instead of removing the original → leaks across user switches.
21. **`Certificate.tsx:62-68`** `user_progress.select(...).in('module_id', ...)` does NOT filter by `user_id`; relies entirely on RLS.
22. **`ModuleView.tsx:96-105`** `fetch(module.pdf_url)` without checking `response.ok` — expired signed URL produces a corrupted "PDF" download.
23. **`Certificate.tsx:117`** student name hard-coded as "Aluno" (FDD-004 will fix).
24. **`Certificate.tsx:200`** + **`ProductView.tsx:198`** UI gates on `progress === 100` but FDD specifies 90% threshold — UX/spec mismatch.
25. **`useRole.tsx`** + **`useAuth.tsx:88`** both query `user_roles` independently → race during user switch + duplicate request.
26. **`ProductForm.tsx:13-17,79`** price uses `z.string().min(1)` + `parseFloat` — no comma decimal handling, no min/max, accepts `"abc"`, negatives, NaN.
27. **`App.tsx:33`** `new QueryClient()` with zero defaults — no `onError`, no `staleTime`, no `retry` policy. FDD-003 §7.1 specs missing.
28. **`App.tsx:96-105`** no fallback route inside `/admin/*` nested Routes — `/admin/garbage` renders an empty layout.

---

## Detailed agent reports

### 1. Auth flows — 22 tests

#### Security / authorization (high)
- Privilege escalation: Signup must NOT elevate role to `'admin'` without RLS allowing it (regression test until ADR-004 fix lands) [Integration]
  - Reason: pin current vulnerable behavior so silent regressions can't widen the hole; will fail the day the planned RLS policy lands
  - Where: `src/pages/auth/Signup.tsx:86-100`
- Privilege escalation via direct call: any authenticated user invoking `supabase.from('user_roles').update({ role: 'admin' })` is rejected [Integration]
  - Reason: proves the boundary is at RLS, not at the page
  - Where: RLS policy on `public.user_roles`
- Role tampering on existing account: a `'user'` cannot self-update their `user_roles` row to `'admin'` via UPDATE [Integration]
  - Reason: distinct from signup race; covers the case of an already-confirmed student
- ProtectedRoute does not leak protected children during the `roleLoading` race window [Unit]
  - Reason: avoid flashing protected DOM during user switches
  - Where: `src/hooks/useAuth.tsx:77-129`
- ProtectedRoute blocks a user whose `user_roles` row is missing [Unit]
  - Reason: prevent fall-through to `setHasAccess(true)` if a refactor reorders branches
  - Where: `src/hooks/useAuth.tsx:107-110`
- ProtectedRoute with `requiredRole="admin"` denies a `'user'` AND redirects them to `/student` [Unit]
  - Reason: prevent admin URL deep-link from rendering blank
  - Where: `src/hooks/useAuth.tsx:98-110`
- Login redirect does not trust client-side role default-to-admin branch [Integration]
  - Reason: when role lookup fails, `Login.tsx:69` pushes to `/admin/dashboard` — known bug
- Sign-out clears local auth state even if `signOut` rejects [Unit]
  - Reason: failed signOut should still result in `user === null`
  - Where: `src/hooks/useAuth.tsx:43-47`

#### Error handling (high)
- Signup: post-signup `user_roles.update` failure shows warning toast and still navigates to admin-login [Unit]
- Signup: "user already registered" Supabase error shows humane message [Unit]
- Login: email-not-confirmed matching is case-insensitive AND covers all Supabase variants [Unit]
- ResetPassword: invalid/expired link triggers 8-second timeout and redirects to `/auth/student-login` [Unit]
- ResetPassword: when role lookup returns null, user is NOT routed to admin by default [Unit]
- ForgotPassword does not reveal whether the email exists [Unit]

#### Race conditions / concurrency (medium)
- Signup race: trigger `handle_new_user` may not have created `user_roles` row when the client UPDATE fires [Integration]
  - Reason: the 1s setTimeout is fragile coordination
- AuthEventHandler does not redirect to reset-password when on student-setup [Unit]
- Concurrent tabs: signing out in tab A invalidates ProtectedRoute in tab B [Integration]
- ResetPassword useEffect cleanup: timeout cleared on unmount [Unit]

#### Edge cases (medium)
- Signup trims whitespace and rejects emails with leading/trailing spaces [Unit]
- Signup password === confirmPassword check is byte-exact (NBSP vs space) [Unit]
- Password length 6 is enforced both client-side AND tolerates Supabase rejection [Unit]
- Login rapid double-submit does not fire two signInWithPassword calls [Unit]
- ForgotPassword surfaces 429 rate-limit cleanly [Unit]
- /auth/student-setup and /auth/reset-password redirect persona-correctly [Integration]

### 2. Admin pages — 30 tests

#### Security / authorization (high)
- Module/product PDF upload sanitizes file extension (no `../`, null bytes, polyglots) [Storage]
- Settings password change: 10+ wrong-current-password attempts have no client backoff [Auth]
- Module/product description and content_text are persisted raw with no DOMPurify call [XSS]
- WebhookSetup leaks Supabase project ref in JSX; production builds should not [Info disclosure]
- AdminLayout has no inline role check; relies on wrapper [Auth]

#### Error handling (high)
- ProductForm.onSubmit: row insert failure after image uploads orphans Storage objects [Consistency]
- Modules.fetchProduct does not filter by admin_id; cross-tenant URL leaks Postgres error [Tenant boundary]
- Purchases.updatePurchaseStatus: send-purchase-confirmation 500 swallowed silently [Notification]
- Purchases.fetchPurchases runs no admin_id filter; relies on RLS [Tenant boundary]
- Dashboard.fetchDashboardStats: 7+ sequential queries, single failure blanks dashboard [Resilience]

#### Cross-tenant isolation (high)
- ProductForm.onSubmit (edit) does `.update().eq('id')` with NO `.eq('admin_id')` [Tenant write]
- Products.handleDelete deletes by id only [Tenant write]
- Modules.confirmDelete deletes by id only [Tenant write]
- Purchases.updatePurchaseStatus updates by purchase id only [Tenant write]

#### Input validation / form edge cases (medium)
- productSchema.price: `parseFloat("1,99")` returns 1; no normalization [Validation]
- moduleSchema.video_url: type switch race [Race]
- moduleSchema.order_index: concurrent admins create modules with same index [Race / ordering]
- Image upload: no client-side max-size, MIME sniffing only via `accept` attribute [Upload validation]
- Module PDF: no max-size; duration_seconds accepts negative, NaN, billions [Upload / validation]
- Settings.handlePasswordChange: only 6 chars, allows current === new [Validation]
- AdminUsers.handleInvite: no Zod schema; accepts `a@b`, multiple `@` [Validation]

#### Optimistic UI / state recovery (medium)
- Products.handleToggleActive: no disabled state on toggle button — admin spam-clicks [Race]
- Purchases.updatePurchaseStatus: no per-row pending state — double-click sends two emails [Race / idempotency]
- AdminUsers.inviteMutation: invalidate key prefix-match brittleness [State sync]

#### Edge cases (medium)
- Products.tsx no pagination; 10k products OOM the browser [Scale]
- ProductCard price formatting: dot vs Brazilian comma [Locale]
- Customers.tsx aggregation: last_purchase only reflects FIRST encountered [Aggregation]
- Dashboard.fetchDashboardStats: month boundary in admin-local timezone [Timezone]
- Dashboard.tsx: empty state for admin with zero products [Empty state]
- ModuleCard.duration_seconds: 0 shows "0min 0s"; negative shows "-1min 30s" [Display]
- Modules.fetchModules: order_index ties produce unstable sort [Sort stability]
- Purchases.stats.revenue: falsy-zero bug `(amount_paid || price)` [Falsy-zero]

### 3. Student pages — 28 tests

#### Security / authorization (high)
- Cross-tenant access via direct URL to ProductView for non-purchased product [Integration]
- Direct navigation to /student/module/:moduleId of unpurchased module [Integration]
- Module-level RLS bypass: is_preview=true on inactive product [DB / RLS]
- Certificate page reads any product/certificate by URL param [Frontend / RLS]
- Student tries to UPDATE another student's progress row [DB / RLS]
- generateCertificate Edge Function called for product without purchase [Edge Function]

#### Error handling / signed URLs (high)
- PDF download with expired signed URL (TTL 3600s elapsed) [Frontend]
- Module type=pdf but pdf_url=null renders blank Card [Frontend]
- Module type=video but video_url=null or malformed YouTube URL [Frontend]
- Text module with content_text=null [Frontend]
- DOMPurify config does NOT strip iframes/scripts from content_text [Security]
- Dashboard fetch failure on single product blocks ALL courses [Frontend]

#### Progress and certificate logic (high)
- Certificate eligibility boundary: 89% / 90% / 91% [Frontend + DB]
- overallProgress based on completed flag, not progress_percentage [Frontend]
- Certificate progress calc does not filter by user_id and counts duplicates [Frontend]
- Generate certificate when one already exists (idempotency) [Edge Function]
- Generate certificate with progress < 90% [Edge Function]
- certificate.completed_at rendered without null-check (FDD-004 v0 transition) [Frontend]
- userName hard-coded as "Aluno" [Frontend]

#### Race conditions / concurrency (medium)
- Concurrent markAsComplete from two tabs creates duplicate user_progress rows [Frontend + DB]
- Last-write-wins regression on progress_percentage [DB / monotonicity trigger]
- Generate certificate clicked twice rapidly [Frontend]

#### Edge cases (medium)
- Empty product (zero modules) [Frontend]
- Product unpublished mid-course (admin sets is_active=false) [Frontend / RLS]
- Admin deletes product after student purchase (orphaned purchase) [Frontend / FK]
- PDF download abandoned; progress not auto-set [Frontend]
- module.duration_seconds null produces NaNmin [Frontend]
- order_index collisions / negative values [Frontend]
- useEffect dependency missing productId revalidation [Frontend]
- Refunded / cancelled purchase still shown on Dashboard [Frontend]

### 4. Edge Functions — 50 tests

#### Security / signature validation (high) — 12 tests
- WEBHOOK_SECRET unset rejects all requests [Unit]
- Missing x-webhook-signature header returns 401, no body details [Unit]
- Wrong-length signature header rejected without timing leak [Unit]
- Equal-length but different secret rejected; iteration runs full length [Unit]
- Header value with trailing whitespace or different case is rejected [Unit]
- Stripe-style stripe-signature header alone returns 401 [Unit]
- send-purchase-confirmation rejects calls without service-role bearer [Unit]
- send-purchase-confirmation rejects bearer with non-matching token [Unit]
- send-notification has NO auth; any caller can insert arbitrary notification [Integration]
- admin-invite-student: non-admin role returns 403, never invokes Resend [Integration]
- admin-invite-student: missing role row treated as forbidden, not admin [Unit]
- admin-invite-student: malformed JWT returns 401, no profile lookup [Unit]

#### Idempotency / race conditions (high) — 8 tests
- Duplicate webhook with same transaction_id updates existing purchase [Integration]
- Concurrent duplicate webhooks (race before constraint) [Integration]
- Status transition pending → approved sends email exactly once [Integration]
- Status transition approved → approved does NOT re-trigger email [Integration]
- Status downgrade approved → cancelled does not unset approved_at [Unit]
- Certificate generation is idempotent on retry [Integration]
- Certificate with existing row but pdf_url=null triggers PDF regeneration (FDD-004) [Integration]
- Concurrent certificate generation for same (user, product) [Integration]
- admin-invite-student called twice for same email [Integration]

#### Error handling — external services (high) — 8 tests
- Resend 429 rate limit: webhook still succeeds [Integration]
- Resend 5xx during admin-invite-student rolls back invite (or doesn't?) [Integration]
- send-purchase-confirmation: invalid recipient returns 500 with raw API error [Unit]
- send-purchase-confirmation: malformed Resend response (non-JSON) doesn't crash [Unit]
- Resend timeout does not hang webhook past Edge limit [Integration]
- process-payment: Stripe API down returns 500, does NOT create user [Integration]
- process-payment: user already exists surfaces friendly message [Unit]
- process-payment: signUp succeeds but role update fails — paying admin gets student role [Integration]
- generate-certificate: SUPABASE_SERVICE_ROLE_KEY missing creates client with empty key [Unit]

#### Input validation — payload edge cases (high) — 17 tests
- webhook payload missing transaction_id returns 400, no DB writes [Unit]
- webhook payload customer_email is whitespace-only [Unit]
- webhook payload with both product_id AND external_product_id [Integration]
- webhook payload with neither product_id nor external_product_id [Integration]
- webhook payload with negative amount [Unit]
- webhook payload with non-numeric amount (string "100.00") [Integration]
- webhook payload status outside enum ('declined', 'chargeback') [Integration]
- webhook payload customer_email with SQL injection [Unit]
- Oversized webhook payload (>1MB JSON) [Integration]
- send-notification: invalid userId (non-UUID) returns 400 [Unit]
- send-notification: missing title or message (NOT NULL columns) [Unit]
- send-notification: type value outside allowed enum [Unit]
- admin-invite-student: invalid email format (no @) [Unit]
- admin-invite-student: email with mixed case treated consistently [Integration]
- create-checkout: plan is __proto__ or constructor — prototype pollution [Unit]
- create-checkout: password exactly 8 chars passes; 7 chars rejected [Unit]
- create-checkout: password contains tabs/newlines stored in Stripe metadata [Unit]
- process-payment: session.metadata is null returns clean 500 [Unit]
- generate-certificate: productId not provided in body [Unit]

#### Authorization / role boundaries (high) — 5 tests
- generate-certificate: anon user (no auth header) returns 400 [Unit]
- generate-certificate: user A requests certificate for product purchased by user B [Integration]
- generate-certificate: admin attempting to generate cert for own product [Integration]
- webhook-payment: payload references external_product_id of different admin [Integration]
- admin-invite-student: admin A invites to product owned by admin B [Integration]

### 5. Database / RLS / triggers — 35 tests

#### Cross-tenant RLS isolation (high) — 8 tests
- Admin A cannot SELECT admin B's products via direct query [Integration]
- Admin A cannot UPDATE/DELETE admin B's product even when guessing the UUID [Integration]
- Admin A cannot INSERT a module under admin B's product_id [Integration]
- Student A cannot SELECT student B's purchases [Integration]
- Student A cannot UPDATE student B's user_progress row (UPDATE-rebind) [Integration]
- Student cannot SELECT non-preview module of unpurchased product (4 sad paths) [Integration]
- Student cannot SELECT modules when their purchase is expired [Integration]
- Student cannot UPDATE the is_preview flag of any module [Integration]

#### Trigger behavior (high) — 6 tests
- handle_new_user is idempotent under retry / replay [Integration]
- handle_new_user failure does not orphan an auth.users row [Integration]
- set_updated_at does not run when only updated_at itself is set [Unit / PgTAP]
- user_progress_monotonic rejects progress_percentage regression [Unit / PgTAP]
- user_progress_monotonic rejects completed=true → false regression [Unit / PgTAP]
- user_progress_monotonic allows equal-value updates (idempotency) [Unit]

#### Constraint enforcement (high) — 8 tests
- Duplicate (user_id, product_id) purchase raises 23505 [Unit]
- Duplicate external_transaction_id raises 23505 (once ADR-005 lands) [Unit]
- progress_percentage = -1 is rejected [Unit]
- progress_percentage = 101 is rejected [Unit]
- purchases.status rejects values outside the four allowed [Unit]
- certificate_number is unique across all rows (collision class) [Unit]
- UNIQUE(user_id, product_id) on certificates blocks duplicate issuance [Unit]
- modules.type rejects unknown enum-as-text [Unit]

#### Function behavior (high) — 7 tests
- has_role() returns false for unknown user_id [Unit]
- has_role() reads roles invisible via RLS (SECURITY DEFINER bypass intent) [Integration]
- has_role() is immune to search_path injection [Unit]
- promote_to_admin() denies non-admin caller [Integration / once ADR-004 lands]
- promote_to_admin() bootstrap: single-use token enforcement [Integration]
- promote_to_admin() with expired token fails [Integration]
- generate_certificate_number() runs without leaking privileges [Unit]

#### View security and edge cases (medium) — 4 tests
- v_user_product_progress returns 0% for product with zero modules [Unit]
- v_user_product_progress recalculates after a module is deleted [Integration]
- v_user_product_progress recalculates after a module is added [Integration]
- v_user_product_progress honors security_invoker = on [Integration]

#### Cascade and time-based logic (medium) — 6 tests
- Deleting auth.users cascades through profiles → all child tables [Integration]
- Deleting a product cascades modules → user_progress [Integration]
- Deleting a product cascades to purchases and certificates [Integration]
- Module visible exactly while purchase has expires_at = NOW() + 1 minute [Integration]
- Module remains visible forever when expires_at IS NULL [Unit]
- Storage RLS: module-content visibility for student with cancelled purchase blocked [Integration]
- Storage RLS: filename substring matching not bypassable [Integration] **(security gap surfaced)**

### 6. Cross-cutting / lib / hooks — 24 tests

#### Error handling and propagation (high) — 4 tests
- QueryClient instantiated with zero defaults [Unit]
- isSupabaseError helper does not exist; will need 5 unit cases when introduced [Unit]
- Mutation onSubmit swallows error after toast (raw Supabase msg leaks) [Unit]
- Toast surfaces raw error.message from Supabase to users [Unit]

#### Cache invalidation and consistency (high) — 3 tests
- No cross-domain invalidation contract anywhere [Integration]
- Optimistic update contract (lock baseline before implementation) [Unit]
- staleTime boundary (after FDD-003 §6.2 ships) [Integration]

#### Sanitization and injection (high) — 5 tests
- module.video_url rendered into iframe without protocol allowlist [Unit]
- notification.action_url used as navigate(action_url) — open-redirect vector [Unit]
- module.pdf_url rendered as href without protocol check [Unit]
- DOMPurify.sanitize called with default config [Unit]
- No sanitization on product/module title/description (cross-layer escaping) [Unit]

#### Routing / Protected boundaries (medium) — 4 tests
- ProtectedRoute race: query in flight, user navigates away [Integration]
- ProtectedRoute null role fallback creates redirect loop [Unit]
- Direct nav as wrong role: admin → /student cross-redirect [Integration]
- App.tsx no fallback Route inside /admin/* nested [Unit]

#### Component robustness (medium) — 4 tests
- ModuleCard thumbnail no onError fallback (broken signed URL) [Unit]
- CourseProgress divides by zero implicitly when totalModules=0 [Unit]
- useNotifications cannot distinguish RLS empty / no data / network error [Unit]
- NotificationDropdown unreadCount limit-20 vs server-side count [Unit]

#### Race conditions / unmount safety (medium) — 4 tests
- useNotifications realtime channel leak (unsubscribe creates new channel) [Unit]
- useNotifications channel name not user-scoped [Unit]
- useRole and ProtectedRoute fire user_roles queries independently [Integration]
- ModuleForm.onSubmit runs through unmount (no abort) [Unit]
- uploadFile uses upsert with Date.now() — collision in same millisecond [Unit]

#### Formatting / locale edge cases (low) — 3 tests
- ProductForm parseFloat("29,90") returns 29 silently [Unit]
- ProductCard displays R$ X.XX instead of R$ X,XX [Unit]
- ModuleCard duration formatting drops hours [Unit]

---

## Recommended prioritization (writing order)

If implementing in phases, write in this order — tier 1 unblocks safe go-live, tier 2 hardens, tier 3 polishes.

### Tier 1 (~70 tests; required before go-live)

- All security / authorization (38 tests): privilege escalation, RLS isolation, signature validation, role boundaries
- All idempotency (18 tests): webhook replays, certificate generation, monotonicity
- Critical error-handling on money flow (~14 tests): webhook → email, Stripe down, payment role-update bug

### Tier 2 (~70 tests; first 30 days post-go-live)

- Input validation / payload edge cases (27 tests)
- Sanitization / XSS (8 tests)
- Trigger / constraint behavior (14 tests)
- Cross-domain cache invalidation (~6 tests)
- Race conditions / unmount safety (~10 tests)
- Cascade / time-based logic (~5 tests)

### Tier 3 (~50 tests; ongoing hardening)

- Component robustness (5 tests)
- Routing / fallback (4 tests)
- View security and cascade (9 tests)
- Edge cases / boundary (21 tests)
- Formatting / locale (5 tests)
- Function behavior unit tests (~6 tests)

---

## Test layer distribution

| Layer | Estimated tests |
|---|---|
| Unit (PgTAP for DB; vitest for FE) | ~80 |
| Integration (multi-context Supabase client; Edge Functions with mocked Resend/Stripe) | ~95 |
| E2E (Playwright; full user flow) | ~14 |
| **Total** | **189** |

The test pyramid is bottom-heavy because:
- RLS isolation only proves itself in integration with real Postgres (PgTAP or Supabase test client).
- Edge Functions mostly test signature validation + DB integration; few are pure logic.
- Frontend logic is thin (mostly forms + queries); most failure modes are integration with Supabase.

---

## Test infrastructure (not yet existing; required before writing)

To write these 189 tests, the project needs:

1. **`vitest`** + `@testing-library/react` + `@testing-library/jest-dom` + `happy-dom` for frontend unit/component tests
2. **`@playwright/test`** for E2E (or **Cypress**)
3. **`pgtap`** + `pg_prove` for DB-layer SQL tests (or use Supabase JS client with two JWT contexts as a shortcut)
4. **`deno test`** for Edge Functions (Deno has built-in test runner)
5. **`msw`** (Mock Service Worker) for mocking Supabase REST + Resend + Stripe in frontend integration tests
6. CI pipeline (GitHub Actions) running all suites on PR

---

## Final summary

**189 tests proposed across 6 areas, all focused on edge cases and sad paths:**

- **104 frontend tests** (Auth: 22, Admin: 30, Student: 28, Cross-cutting: 24)
- **85 backend tests** (Edge Functions: 50, Database/RLS: 35)

**Plus 28 production bugs surfaced during the analysis** (separate from the test plan; each warrants a fix independent of testing) — see "Critical production bugs surfaced" section above.

**No happy-path tests are included in this 189 count.** Adding minimal happy-path coverage (one test per page/Edge Function/critical RLS policy) would add another ~50 tests, bringing total expected coverage to ~240 tests for a well-tested v1.0.

This analysis intentionally **does not propose** tests for:
- Items already on the roadmap (privilege escalation fix, UNIQUE on external_transaction_id, etc.) as if they were new findings — those are flagged as "regression tests once the fix lands"
- Framework behavior (React rendering, React Router routing, Supabase JS client internals)
- Mirror tests (assertions that copy implementation return values)
- Single-path utilities without conditionals
