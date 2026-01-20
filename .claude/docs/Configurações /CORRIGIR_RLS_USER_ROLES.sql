-- ============================================================
-- 🔧 CORRIGIR RLS DA TABELA user_roles
-- ============================================================
-- Este é o FIX mais provável para o erro "Database error querying schema"
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- PROBLEMA IDENTIFICADO:
-- A tabela user_roles tem RLS habilitado mas pode não ter
-- políticas adequadas, bloqueando a query do login
-- ============================================================

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver própria role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- ============================================================
-- 2. CRIAR POLÍTICA PARA LEITURA (SELECT)
-- ============================================================
-- Esta política permite que usuários autenticados vejam sua própria role
CREATE POLICY "users_can_view_own_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. GARANTIR QUE O TIPO ENUM EXISTE
-- ============================================================
-- Criar tipo ENUM se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- ============================================================
-- 4. VERIFICAR SE A CONSTRAINT ESTÁ CORRETA
-- ============================================================
-- A tabela user_roles deve ter UNIQUE(user_id) e não UNIQUE(user_id, role)
-- Vamos verificar e corrigir se necessário

-- Primeiro, remover constraint antiga se existir
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Adicionar constraint correta (cada usuário tem apenas uma role)
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- ============================================================
-- 5. GARANTIR QUE O ADMIN TEM PROFILE E ROLE
-- ============================================================

-- Criar profile se não existir
INSERT INTO public.profiles (id, email, full_name)
SELECT
    id,
    email,
    'Admin Teste'
FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (id) DO UPDATE
SET full_name = 'Admin Teste',
    email = EXCLUDED.email;

-- Deletar role antiga e inserir nova
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com');

INSERT INTO public.user_roles (user_id, role)
SELECT
    id,
    'admin'::app_role
FROM auth.users
WHERE email = 'admin@teste.com';

-- ============================================================
-- 6. VERIFICAR SE ESTÁ FUNCIONANDO
-- ============================================================

-- Esta query simula o que o código faz no login
-- Se retornar a role corretamente, o problema está resolvido
SELECT
    ur.role,
    p.email,
    p.full_name
FROM public.user_roles ur
INNER JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com');

-- ============================================================
-- ✅ RESULTADO ESPERADO:
-- Deve mostrar:
-- role: admin
-- email: admin@teste.com
-- full_name: Admin Teste
-- ============================================================

-- ============================================================
-- 7. VERIFICAR POLÍTICAS ATIVAS
-- ============================================================
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- Deve mostrar:
-- policyname: users_can_view_own_roles
-- cmd: SELECT
-- qual: (auth.uid() = user_id)
-- ============================================================
