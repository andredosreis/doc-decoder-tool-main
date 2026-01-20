-- ============================================================
-- 🔍 DIAGNÓSTICO DO ERRO "Database error querying schema"
-- ============================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- para diagnosticar o problema
-- ============================================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================
-- 2. VERIFICAR RLS (Row Level Security)
-- ============================================================
SELECT
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- 3. VERIFICAR POLÍTICAS RLS DA TABELA user_roles
-- ============================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- ============================================================
-- 4. VERIFICAR SE O TIPO ENUM app_role EXISTE
-- ============================================================
SELECT
    n.nspname as schema,
    t.typname as enum_name,
    e.enumlabel as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;

-- ============================================================
-- 5. VERIFICAR SE O ADMIN TEM PROFILE E ROLE
-- ============================================================
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    p.id as profile_id,
    p.full_name,
    ur.id as user_role_id,
    ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';

-- ============================================================
-- 6. VERIFICAR SE HÁ CONSTRAINT ERRADA NA TABELA user_roles
-- ============================================================
SELECT
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'user_roles'
ORDER BY constraint_type;

-- ============================================================
-- 7. TESTAR QUERY DIRETA NA TABELA user_roles
-- ============================================================
-- Esta é a query que falha no código
SELECT role
FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com' LIMIT 1);

-- ============================================================
-- ✅ ANÁLISE DOS RESULTADOS:
-- ============================================================
--
-- Se a query acima (7) falhar, o problema pode ser:
--
-- A) RLS está habilitado mas SEM políticas adequadas
--    Solução: Adicionar políticas RLS
--
-- B) Constraint UNIQUE errada (user_id, role) ao invés de UNIQUE (user_id)
--    Solução: Alterar constraint
--
-- C) Tipo ENUM app_role não existe
--    Solução: Criar tipo ENUM
--
-- D) Usuário não tem profile/role cadastrado
--    Solução: Inserir manualmente
--
-- ============================================================
