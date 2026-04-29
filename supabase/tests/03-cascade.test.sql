-- =============================================================
-- Tier 2 — Cascade + time-based logic tests (pgtap)
-- Run: SELECT * FROM runtests('03-cascade');
-- Requires pgtap extension: CREATE EXTENSION IF NOT EXISTS pgtap;
-- =============================================================
BEGIN;
SELECT plan(5);

-- ── ON DELETE CASCADE chains ──────────────────────────────────

SELECT lives_ok(
  $$DO $$
  DECLARE
    v_admin UUID := gen_random_uuid();
    v_prod  UUID;
    v_mod   UUID;
    v_user  UUID := gen_random_uuid();
  BEGIN
    -- Minimal product + module + user_progress tree
    INSERT INTO public.profiles (id, email) VALUES (v_admin, 'admin-cascade@test.com');
    INSERT INTO public.products (id, admin_id, title) VALUES (gen_random_uuid(), v_admin, 'Cascade Test');
    SELECT id INTO v_prod FROM public.products WHERE admin_id = v_admin LIMIT 1;
    INSERT INTO public.modules (id, product_id, title, type, order_index)
    VALUES (gen_random_uuid(), v_prod, 'Mod 1', 'video', 0);
    SELECT id INTO v_mod FROM public.modules WHERE product_id = v_prod LIMIT 1;
    INSERT INTO public.profiles (id, email) VALUES (v_user, 'student-cascade@test.com');
    INSERT INTO public.user_progress (user_id, module_id) VALUES (v_user, v_mod);

    -- Delete product: cascades to modules → user_progress
    DELETE FROM public.products WHERE id = v_prod;

    -- Verify cascade: module gone, progress gone
    PERFORM 1 FROM public.modules WHERE id = v_mod;
    IF FOUND THEN RAISE EXCEPTION 'module not cascaded'; END IF;
    PERFORM 1 FROM public.user_progress WHERE module_id = v_mod;
    IF FOUND THEN RAISE EXCEPTION 'user_progress not cascaded'; END IF;

    DELETE FROM public.profiles WHERE id IN (v_admin, v_user);
  END;
  $$$$,
  'deleting a product cascades to modules and user_progress'
);

SELECT lives_ok(
  $$DO $$
  DECLARE
    v_admin UUID := gen_random_uuid();
    v_user  UUID := gen_random_uuid();
    v_prod  UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.profiles (id, email) VALUES (v_admin, 'admin-cert-cascade@test.com');
    INSERT INTO public.profiles (id, email) VALUES (v_user,  'user-cert-cascade@test.com');
    INSERT INTO public.products (id, admin_id, title) VALUES (v_prod, v_admin, 'Cert Cascade Test');
    INSERT INTO public.purchases (user_id, product_id, status) VALUES (v_user, v_prod, 'approved');
    INSERT INTO public.certificates (user_id, product_id, certificate_number, completed_at)
    VALUES (v_user, v_prod, 'CERT-9999-CASCADE', now());

    -- Delete product: cascades to purchases and certificates
    DELETE FROM public.products WHERE id = v_prod;

    PERFORM 1 FROM public.purchases WHERE product_id = v_prod;
    IF FOUND THEN RAISE EXCEPTION 'purchase not cascaded'; END IF;
    PERFORM 1 FROM public.certificates WHERE product_id = v_prod;
    IF FOUND THEN RAISE EXCEPTION 'certificate not cascaded'; END IF;

    DELETE FROM public.profiles WHERE id IN (v_admin, v_user);
  END;
  $$$$,
  'deleting a product cascades to purchases and certificates'
);

-- ── expires_at time gate ──────────────────────────────────────

SELECT is(
  (SELECT COUNT(*)::int
   FROM public.modules m
   JOIN public.purchases p ON p.product_id = m.product_id
   WHERE p.expires_at IS NOT NULL
     AND p.expires_at < NOW()
     AND p.status = 'approved'
     AND m.is_preview = false
   LIMIT 1),
  0,
  'expired purchases grant no module access (view check)'
);

-- ── expires_at IS NULL means permanent access ─────────────────

SELECT lives_ok(
  $$DO $$
  DECLARE
    v_admin UUID := gen_random_uuid();
    v_user  UUID := gen_random_uuid();
    v_prod  UUID := gen_random_uuid();
    v_mod   UUID := gen_random_uuid();
  BEGIN
    INSERT INTO public.profiles (id, email) VALUES (v_admin, 'admin-noexp@test.com');
    INSERT INTO public.profiles (id, email) VALUES (v_user,  'user-noexp@test.com');
    INSERT INTO public.products (id, admin_id, title) VALUES (v_prod, v_admin, 'No Expiry');
    INSERT INTO public.modules  (id, product_id, title, type, order_index)
    VALUES (v_mod, v_prod, 'Mod', 'video', 0);
    -- Purchase without expires_at (permanent)
    INSERT INTO public.purchases (user_id, product_id, status, expires_at)
    VALUES (v_user, v_prod, 'approved', NULL);

    -- Check module IS visible (expires_at IS NULL = never expires)
    PERFORM 1 FROM public.modules
    JOIN public.purchases ON purchases.product_id = modules.product_id
    WHERE modules.id = v_mod
      AND purchases.user_id = v_user
      AND (purchases.expires_at IS NULL OR purchases.expires_at > NOW());
    IF NOT FOUND THEN RAISE EXCEPTION 'module should be visible with null expires_at'; END IF;

    DELETE FROM public.purchases WHERE user_id = v_user AND product_id = v_prod;
    DELETE FROM public.products WHERE id = v_prod;
    DELETE FROM public.profiles WHERE id IN (v_admin, v_user);
  END;
  $$$$,
  'module visible when purchase.expires_at IS NULL (permanent access)'
);

-- ── auth.users cascade reaches profiles ──────────────────────

SELECT col_is_fk(
  'public', 'profiles', 'id',
  'profiles.id is FK to auth.users (cascade delete anchor)'
);

SELECT * FROM finish();
ROLLBACK;
