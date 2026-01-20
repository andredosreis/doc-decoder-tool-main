-- ============================================================
-- 🔧 VERIFICAR E CORRIGIR TRIGGERS
-- ============================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. VERIFICAR SE OS TRIGGERS EXISTEM
SELECT
    trigger_name,
    event_object_table as tabela,
    action_timing as quando,
    event_manipulation as evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 2. VERIFICAR SE O TRIGGER DE AUTH EXISTE
SELECT
    trigger_name,
    event_object_table as tabela
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND event_object_table = 'users';

-- ============================================================
-- 3. RECRIAR O TRIGGER DE CRIAÇÃO DE USUÁRIO
-- ============================================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar a função
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Inserir role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. VERIFICAR SE O PROFILE DO ADMIN EXISTE
-- ============================================================
SELECT
    p.id,
    p.email,
    p.full_name,
    ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'admin@teste.com';

-- ============================================================
-- 5. SE NÃO EXISTIR PROFILE, CRIAR MANUALMENTE
-- ============================================================

-- Inserir profile do admin (caso não exista)
INSERT INTO public.profiles (id, email, full_name)
SELECT
    id,
    email,
    'Admin Teste'
FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (id) DO NOTHING;

-- Garantir que a role seja admin
INSERT INTO public.user_roles (user_id, role)
SELECT
    id,
    'admin'::app_role
FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin'::app_role;

-- ============================================================
-- 6. VERIFICAR NOVAMENTE SE ESTÁ TUDO OK
-- ============================================================
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    p.full_name,
    ur.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';

-- ============================================================
-- ✅ RESULTADO ESPERADO:
-- Deve mostrar uma linha com:
-- - email: admin@teste.com
-- - full_name: Admin Teste
-- - role: admin
-- ============================================================
