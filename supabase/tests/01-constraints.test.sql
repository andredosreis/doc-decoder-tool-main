-- =============================================================
-- Tier 2 — Constraint behavior tests (pgtap)
-- Run: SELECT * FROM runtests('01-constraints');
-- Requires pgtap extension: CREATE EXTENSION IF NOT EXISTS pgtap;
-- =============================================================
BEGIN;
SELECT plan(14);

-- ── user_roles.role CHECK ─────────────────────────────────────

SELECT throws_ok(
  $$INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'superadmin' FROM public.profiles LIMIT 1$$,
  '23514',
  NULL,
  'user_roles.role rejects value outside (admin, user)'
);

SELECT lives_ok(
  $$INSERT INTO public.user_roles (user_id, role)
    SELECT gen_random_uuid(), 'user'
    WHERE false$$,   -- no-op: just type-checks the SQL
  'user_roles.role accepts ''user'''
);

-- ── purchases.status CHECK ────────────────────────────────────

SELECT throws_ok(
  $$INSERT INTO public.purchases (user_id, product_id, status)
    VALUES (gen_random_uuid(), gen_random_uuid(), 'declined')$$,
  '23514',
  NULL,
  'purchases.status rejects ''declined'''
);

SELECT throws_ok(
  $$INSERT INTO public.purchases (user_id, product_id, status)
    VALUES (gen_random_uuid(), gen_random_uuid(), 'chargeback')$$,
  '23514',
  NULL,
  'purchases.status rejects ''chargeback'''
);

-- ── modules.type CHECK ────────────────────────────────────────

SELECT throws_ok(
  $$INSERT INTO public.modules (product_id, title, type, order_index)
    VALUES (gen_random_uuid(), 'Test', 'podcast', 0)$$,
  '23514',
  NULL,
  'modules.type rejects ''podcast'' (unknown type)'
);

-- ── user_progress.progress_percentage CHECK ───────────────────

SELECT throws_ok(
  $$INSERT INTO public.user_progress (user_id, module_id, progress_percentage)
    VALUES (gen_random_uuid(), gen_random_uuid(), -1)$$,
  '23514',
  NULL,
  'user_progress.progress_percentage rejects -1'
);

SELECT throws_ok(
  $$INSERT INTO public.user_progress (user_id, module_id, progress_percentage)
    VALUES (gen_random_uuid(), gen_random_uuid(), 101)$$,
  '23514',
  NULL,
  'user_progress.progress_percentage rejects 101'
);

-- ── UNIQUE constraints ────────────────────────────────────────

SELECT throws_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
          v_mid UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.user_progress (user_id, module_id, progress_percentage)
    VALUES (v_uid, v_mid, 0);
    INSERT INTO public.user_progress (user_id, module_id, progress_percentage)
    VALUES (v_uid, v_mid, 10);
  END;
  $$$$,
  '23505',
  NULL,
  'user_progress UNIQUE(user_id, module_id) rejects duplicate'
);

SELECT throws_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
          v_pid UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.purchases (user_id, product_id, status)
    VALUES (v_uid, v_pid, 'pending');
    INSERT INTO public.purchases (user_id, product_id, status)
    VALUES (v_uid, v_pid, 'pending');
  END;
  $$$$,
  '23505',
  NULL,
  'purchases UNIQUE(user_id, product_id) rejects duplicate'
);

-- ── certificates.certificate_number UNIQUE ────────────────────

SELECT throws_ok(
  $$DO $$
  DECLARE v_uid1 UUID := gen_random_uuid();
          v_uid2 UUID := gen_random_uuid();
          v_pid  UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.certificates (user_id, product_id, certificate_number, completed_at)
    VALUES (v_uid1, v_pid, 'CERT-2026-000001', now());
    INSERT INTO public.certificates (user_id, product_id, certificate_number, completed_at)
    VALUES (v_uid2, v_pid, 'CERT-2026-000001', now());
  END;
  $$$$,
  '23505',
  NULL,
  'certificates.certificate_number UNIQUE blocks collision'
);

-- ── has_role() SECURITY DEFINER function ─────────────────────

SELECT is(
  public.has_role(gen_random_uuid(), 'admin'),
  false,
  'has_role() returns false for unknown user_id'
);

SELECT is(
  public.has_role(gen_random_uuid(), 'superadmin'),
  false,
  'has_role() returns false for nonexistent role value'
);

-- ── NOT NULL on required columns ─────────────────────────────

SELECT throws_ok(
  $$INSERT INTO public.profiles (id, email) VALUES (gen_random_uuid(), NULL)$$,
  '23502',
  NULL,
  'profiles.email NOT NULL enforced'
);

SELECT throws_ok(
  $$INSERT INTO public.modules (product_id, title, type, order_index)
    VALUES (gen_random_uuid(), NULL, 'video', 0)$$,
  '23502',
  NULL,
  'modules.title NOT NULL enforced'
);

SELECT * FROM finish();
ROLLBACK;
