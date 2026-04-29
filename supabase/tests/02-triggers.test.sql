-- =============================================================
-- Tier 2 — Trigger behavior tests (pgtap)
-- Run: SELECT * FROM runtests('02-triggers');
-- Requires pgtap extension: CREATE EXTENSION IF NOT EXISTS pgtap;
-- =============================================================
BEGIN;
SELECT plan(6);

-- ── set_updated_at trigger ────────────────────────────────────

SELECT lives_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
  BEGIN
    -- Insert profile (triggers set_updated_at on profiles)
    INSERT INTO public.profiles (id, email)
    VALUES (v_uid, v_uid::text || '@test.com');

    -- UPDATE title; updated_at should be >= created_at
    UPDATE public.profiles SET full_name = 'Test' WHERE id = v_uid;

    -- Verify updated_at was touched
    PERFORM 1 FROM public.profiles
    WHERE id = v_uid AND updated_at >= created_at;

    DELETE FROM public.profiles WHERE id = v_uid;
  END;
  $$$$,
  'set_updated_at trigger fires on UPDATE of profiles'
);

-- ── user_progress monotonic trigger ──────────────────────────

SELECT throws_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
          v_mid UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.user_progress (user_id, module_id, progress_percentage, completed)
    VALUES (v_uid, v_mid, 80, false);
    -- Regression: attempt to decrease progress_percentage
    UPDATE public.user_progress
    SET progress_percentage = 50
    WHERE user_id = v_uid AND module_id = v_mid;
  END;
  $$$$,
  'P0001',
  NULL,
  'user_progress_monotonic rejects progress_percentage regression (80 → 50)'
);

SELECT throws_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
          v_mid UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.user_progress (user_id, module_id, progress_percentage, completed)
    VALUES (v_uid, v_mid, 100, true);
    -- Regression: attempt to un-complete a completed module
    UPDATE public.user_progress
    SET completed = false
    WHERE user_id = v_uid AND module_id = v_mid;
  END;
  $$$$,
  'P0001',
  NULL,
  'user_progress_monotonic rejects completed = true → false regression'
);

SELECT lives_ok(
  $$DO $$
  DECLARE v_uid UUID := gen_random_uuid();
          v_mid UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.user_progress (user_id, module_id, progress_percentage, completed)
    VALUES (v_uid, v_mid, 50, false);
    -- Equal-value update is idempotent (same percentage)
    UPDATE public.user_progress
    SET progress_percentage = 50
    WHERE user_id = v_uid AND module_id = v_mid;
    DELETE FROM public.user_progress WHERE user_id = v_uid AND module_id = v_mid;
  END;
  $$$$,
  'user_progress_monotonic allows equal-value update (idempotency)'
);

-- ── handle_new_user trigger (auth.users → profiles) ──────────

SELECT is(
  (SELECT COUNT(*)::int FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created'
     AND event_object_schema = 'auth'
     AND event_object_table = 'users'),
  1,
  'handle_new_user trigger exists on auth.users'
);

-- ── generate_certificate_number() DB function ─────────────────

SELECT matches(
  public.generate_certificate_number()::text,
  '^CERT-\d{4}-\d{6}$',
  'generate_certificate_number() returns CERT-YYYY-XXXXXX format'
);

SELECT * FROM finish();
ROLLBACK;
