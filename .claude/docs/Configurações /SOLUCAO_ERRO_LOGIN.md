# Solução para Erro "Database error querying schema"

## Problema
O erro aparece porque as **tabelas do banco de dados não foram criadas** no Supabase.

## Solução Rápida (10 minutos)

### Passo 1: Acessar o Supabase
1. Acesse: https://supabase.com/dashboard/project/qdaorpyedwpcaaezsaxp
2. Faça login
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar SQL Completo
1. Clique em **"New query"**
2. Copie TODO o conteúdo do arquivo: `MIGRATION_COMPLETA.sql`
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar 10-20 segundos)

### Passo 3: Criar Buckets de Storage
1. No menu lateral, clique em **Storage**
2. Clique em **"New bucket"**
3. Crie dois buckets:
   - Nome: `product-images` | Marque: Public ✓
   - Nome: `module-content` | Marque: Public ✓

### Passo 4: Criar Usuário Admin
1. Volte ao **SQL Editor**
2. Execute este SQL:

```sql
-- Verificar se admin@teste.com já existe
SELECT id, email FROM auth.users WHERE email = 'admin@teste.com';

-- Se não existir, criar:
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
)
ON CONFLICT (email) DO NOTHING;

-- Garantir que profile e role existem
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, 'Admin Teste'
FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Admin Teste';

DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@teste.com';

-- Verificar resultado
SELECT
  au.id,
  au.email,
  p.full_name,
  ur.role
FROM auth.users au
INNER JOIN public.profiles p ON p.id = au.id
INNER JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';
```

### Passo 5: Reiniciar Servidor Local
```bash
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### Passo 6: Testar Login
1. Acesse: http://localhost:8080/auth/admin-login
2. Use as credenciais:
   - Email: `admin@teste.com`
   - Senha: `Admin123!`

---

## Verificação

Execute este SQL para garantir que tudo está OK:

```sql
-- Listar todas as tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve mostrar:
-- certificates
-- modules
-- notifications
-- products
-- profiles
-- purchases
-- user_progress
-- user_roles

-- Verificar admin
SELECT
  au.email,
  p.full_name,
  ur.role
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'admin@teste.com';

-- Deve retornar:
-- email: admin@teste.com
-- full_name: Admin Teste
-- role: admin
```

---

## Se ainda der erro

### Erro 1: "relation does not exist"
**Causa:** Tabela não foi criada
**Solução:** Execute novamente o SQL do Passo 2

### Erro 2: "duplicate key value"
**Causa:** Admin já existe
**Solução:** Pule a criação do admin, use apenas o UPDATE de role

### Erro 3: "type app_role does not exist"
**Causa:** ENUM não foi criado
**Solução:** Execute primeiro:
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
```

---

## Checklist Final

- [ ] SQL da migration executado com sucesso
- [ ] Buckets criados (product-images e module-content)
- [ ] Usuário admin criado
- [ ] Login funcionando
- [ ] Dashboard carregando sem erros

---

## Credenciais de Teste

**Admin:**
- URL: http://localhost:8080/auth/admin-login
- Email: admin@teste.com
- Senha: Admin123!

**Aluno (criar via signup):**
- URL: http://localhost:8080/auth/signup
- Use qualquer email válido
