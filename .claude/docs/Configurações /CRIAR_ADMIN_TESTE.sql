-- ============================================================
-- 👤 CRIAR ADMIN DE TESTE
-- ============================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- Credenciais do Admin de Teste:
-- Email: admin@teste.com
-- Senha: Admin123!

-- ============================================================
-- 1. Criar usuário na tabela auth.users
-- ============================================================
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@teste.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin Teste"}',
  NOW(),
  NOW(),
  ''
);

-- ============================================================
-- 2. Verificar se o usuário foi criado
-- ============================================================
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as nome,
  created_at
FROM auth.users
WHERE email = 'admin@teste.com';

-- ============================================================
-- 3. Atualizar role para admin
-- ============================================================
UPDATE user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'admin@teste.com'
);

-- ============================================================
-- 4. Verificar se virou admin
-- ============================================================
SELECT
  p.id,
  p.email,
  p.full_name,
  ur.role,
  p.created_at
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'admin@teste.com';

-- ============================================================
-- ✅ PRONTO! Agora você pode fazer login com:
-- ============================================================
-- URL: http://localhost:8080/auth/admin-login
-- Email: admin@teste.com
-- Senha: Admin123!
-- ============================================================
