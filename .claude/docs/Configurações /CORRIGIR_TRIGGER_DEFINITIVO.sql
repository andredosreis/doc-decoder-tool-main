-- ============================================================
-- 🔧 CORRIGIR TRIGGER DEFINITIVAMENTE
-- ============================================================
-- Este SQL vai remover e recriar o trigger corretamente
-- ============================================================

-- 1. REMOVER TRIGGER EXISTENTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. REMOVER FUNÇÃO EXISTENTE
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. VERIFICAR SE O ADMIN JÁ TEM PROFILE E ROLE
SELECT
    au.id,
    au.email,
    p.id as profile_id,
    ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';

-- ============================================================
-- 4. CRIAR PROFILE E ROLE MANUALMENTE PARA O ADMIN
-- ============================================================

-- Garantir que o profile existe
INSERT INTO public.profiles (id, email, full_name)
SELECT
    id,
    email,
    'Admin Teste'
FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = 'Admin Teste';

-- Garantir que a role é admin
DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com');

INSERT INTO public.user_roles (user_id, role)
SELECT
    id,
    'admin'::app_role
FROM auth.users
WHERE email = 'admin@teste.com';

-- 5. VERIFICAR SE ESTÁ CORRETO
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    p.full_name as nome,
    ur.role
FROM auth.users au
INNER JOIN public.profiles p ON p.id = au.id
INNER JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';

-- ============================================================
-- 6. NÃO RECRIAR O TRIGGER (evitar conflitos)
-- ============================================================
-- Para novos usuários, você pode criar manualmente ou adicionar
-- o trigger depois de testar que o login funciona

-- ============================================================
-- ✅ RESULTADO ESPERADO:
-- Deve mostrar:
-- - email: admin@teste.com
-- - nome: Admin Teste
-- - role: admin
-- ============================================================
