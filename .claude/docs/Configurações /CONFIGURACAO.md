# 🔧 Guia de Configuração - Plataforma de Cursos Online

Este guia detalha **TUDO** que você precisa fazer para o projeto funcionar completamente.

---

## 📋 Status Atual do Projeto

### ✅ O que JÁ está funcionando

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| Frontend | ✅ Funcionando | Roda em `http://localhost:8080` |
| Rotas e navegação | ✅ Funcionando | Todas as páginas acessíveis |
| Componentes UI | ✅ Funcionando | shadcn/ui configurado |
| Landing page | ✅ Funcionando | Completa e responsiva |
| Sistema de autenticação (UI) | ✅ Funcionando | Formulários prontos |
| CRUD Admin (UI) | ✅ Funcionando | Interfaces criadas |
| Área do Aluno (UI) | ✅ Funcionando | Interface pronta |

### ⚠️ O que FALTA configurar

| Item | Prioridade | Impacto |
|------|------------|---------|
| Criar projeto no Supabase | 🔴 CRÍTICO | Sem isso, nada funciona |
| Configurar variáveis de ambiente | 🔴 CRÍTICO | Login/cadastro não funcionam |
| Criar tabelas no banco | 🔴 CRÍTICO | Dados não são salvos |
| Criar buckets no Storage | 🔴 CRÍTICO | Upload de arquivos falha |
| Configurar RLS (segurança) | 🟡 IMPORTANTE | Proteção de dados |
| Criar triggers para roles | 🟡 IMPORTANTE | Controle de acesso |
| Atualizar Dashboard com dados reais | 🟢 DESEJÁVEL | Métricas em tempo real |
| Deploy das Edge Functions | 🟢 DESEJÁVEL | Webhooks e notificações |

---

## 🚀 Passo a Passo de Configuração

### **ETAPA 1: Configurar Supabase**

#### 1.1 Criar projeto no Supabase

1. Acesse: https://supabase.com
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `plataforma-cursos` (ou nome de sua escolha)
   - **Database Password**: Crie uma senha forte e **GUARDE**
   - **Region**: Escolha o mais próximo (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos até o projeto ser provisionado

#### 1.2 Copiar credenciais

Após o projeto ser criado:

1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API**
3. Copie:
   - **Project URL** (exemplo: `https://xxxxxxxxxxx.supabase.co`)
   - **anon/public key** (chave longa começando com `eyJ...`)

#### 1.3 Configurar arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App Configuration
VITE_APP_NAME=Plataforma de Cursos
VITE_APP_URL=http://localhost:8080

# Optional: Analytics
VITE_ENABLE_ANALYTICS=false
```

**⚠️ IMPORTANTE:** Reinicie o servidor após alterar o `.env`:
```bash
# Ctrl+C para parar
npm run dev
```

---

### **ETAPA 2: Criar Estrutura do Banco de Dados**

#### 2.1 Criar tabelas

No Supabase Dashboard:

1. Clique em **SQL Editor** (no menu lateral)
2. Clique em **"New query"**
3. Cole o SQL abaixo:

```sql
-- ================================================
-- TABELA: profiles
-- Perfis de usuários (criada automaticamente via trigger)
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: user_roles
-- Sistema de roles (admin/user)
-- ================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ================================================
-- TABELA: products
-- Produtos/Cursos
-- ================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  thumbnail_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  external_product_id TEXT,
  payment_platform TEXT,
  webhook_secret TEXT,
  theme_primary TEXT,
  theme_secondary TEXT,
  theme_accent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: modules
-- Módulos/Aulas dos produtos
-- ================================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'text', 'quiz')),
  video_url TEXT,
  pdf_url TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  order_index INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: purchases
-- Compras de produtos
-- ================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled', 'refunded')),
  amount_paid NUMERIC(10,2),
  payment_platform TEXT,
  external_transaction_id TEXT,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: user_progress
-- Progresso dos alunos nos módulos
-- ================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  last_position_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- ================================================
-- TABELA: certificates
-- Certificados de conclusão
-- ================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: notifications
-- Sistema de notificações
-- ================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ÍNDICES para performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_products_admin_id ON products(admin_id);
CREATE INDEX IF NOT EXISTS idx_modules_product_id ON modules(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
```

4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Verifique se apareceu "Success. No rows returned"

#### 2.2 Criar Triggers

Cole este SQL para criar os triggers automáticos:

```sql
-- ================================================
-- TRIGGER: Criar profile automaticamente
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ================================================
-- TRIGGER: Criar role "user" automaticamente
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON modules;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

#### 2.3 Criar função para gerar números de certificado

```sql
-- ================================================
-- FUNÇÃO: Gerar número de certificado único
-- ================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Gerar número no formato: CERT-YYYY-XXXXXX
    new_number := 'CERT-' ||
                  TO_CHAR(NOW(), 'YYYY') || '-' ||
                  LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');

    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM certificates WHERE certificate_number = new_number
    ) INTO exists_check;

    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

#### 2.4 Criar função para verificar role

```sql
-- ================================================
-- FUNÇÃO: Verificar se usuário tem determinada role
-- ================================================
CREATE OR REPLACE FUNCTION public.has_role(_role TEXT, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### **ETAPA 3: Configurar RLS (Row Level Security)**

#### 3.1 Habilitar RLS em todas as tabelas

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

#### 3.2 Criar políticas de segurança

```sql
-- ================================================
-- POLÍTICAS: profiles
-- ================================================
CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ================================================
-- POLÍTICAS: user_roles
-- ================================================
CREATE POLICY "Usuários podem ver própria role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ================================================
-- POLÍTICAS: products
-- ================================================
CREATE POLICY "Todos podem ver produtos ativos"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin pode gerenciar próprios produtos"
  ON products FOR ALL
  USING (auth.uid() = admin_id);

-- ================================================
-- POLÍTICAS: modules
-- ================================================
CREATE POLICY "Todos podem ver módulos de produtos ativos"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = modules.product_id
      AND products.is_active = true
    )
  );

CREATE POLICY "Admin pode gerenciar módulos dos próprios produtos"
  ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = modules.product_id
      AND products.admin_id = auth.uid()
    )
  );

-- ================================================
-- POLÍTICAS: purchases
-- ================================================
CREATE POLICY "Usuário vê próprias compras"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê compras dos próprios produtos"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = purchases.product_id
      AND products.admin_id = auth.uid()
    )
  );

-- ================================================
-- POLÍTICAS: user_progress
-- ================================================
CREATE POLICY "Usuário vê próprio progresso"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza próprio progresso"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário modifica próprio progresso"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================
-- POLÍTICAS: certificates
-- ================================================
CREATE POLICY "Usuário vê próprios certificados"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

-- ================================================
-- POLÍTICAS: notifications
-- ================================================
CREATE POLICY "Usuário vê próprias notificações"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza próprias notificações"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### **ETAPA 4: Criar Buckets no Storage**

1. No Supabase, clique em **Storage** (menu lateral)
2. Clique em **"New bucket"**

#### Bucket 1: `product-images`
- **Name:** `product-images`
- **Public:** ✅ Marcar como público
- Clique em **"Create bucket"**

#### Bucket 2: `module-content`
- **Name:** `module-content`
- **Public:** ✅ Marcar como público
- Clique em **"Create bucket"**

#### 4.1 Configurar políticas de Storage

Clique em cada bucket e depois em **"Policies"**:

**Para `product-images`:**
```sql
-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Todos podem visualizar
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Usuário pode deletar próprios arquivos
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());
```

**Para `module-content`:**
```sql
-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'module-content');

-- Todos podem visualizar
CREATE POLICY "Public can view content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'module-content');

-- Usuário pode deletar próprios arquivos
CREATE POLICY "Users can delete own content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'module-content' AND owner = auth.uid());
```

---

### **ETAPA 5: Criar primeiro usuário Admin**

Após toda configuração, você precisa de um admin para acessar o painel.

#### Opção 1: Via Interface (Recomendado)

1. Abra o projeto: `http://localhost:8080/auth/signup`
2. Cadastre-se normalmente
3. Vá no Supabase Dashboard → **SQL Editor**
4. Execute:

```sql
-- Substitua o email pelo seu
UPDATE user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'seu@email.com'
);
```

#### Opção 2: Via SQL (Direto)

```sql
-- Criar usuário admin manualmente (substitua os dados)
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
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@exemplo.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin Principal"}',
  NOW(),
  NOW()
);
```

---

## ✅ Checklist Final

Marque conforme for fazendo:

- [ ] ✅ Projeto Supabase criado
- [ ] ✅ Arquivo `.env` configurado com credenciais
- [ ] ✅ Servidor reiniciado após configurar `.env`
- [ ] ✅ Tabelas criadas no banco
- [ ] ✅ Triggers criados
- [ ] ✅ Funções criadas
- [ ] ✅ RLS habilitado
- [ ] ✅ Políticas de segurança criadas
- [ ] ✅ Bucket `product-images` criado
- [ ] ✅ Bucket `module-content` criado
- [ ] ✅ Políticas de Storage configuradas
- [ ] ✅ Primeiro usuário admin criado

---

## 🧪 Testar Funcionalidades

Após configurar tudo:

### 1. Testar Cadastro
- Acesse: `http://localhost:8080/auth/signup`
- Crie uma conta
- Verifique se apareceu no Supabase (Authentication → Users)

### 2. Testar Login Admin
- Acesse: `http://localhost:8080/auth/admin-login`
- Faça login com o admin criado
- Deve redirecionar para `/admin/dashboard`

### 3. Testar CRUD de Produtos
- No painel admin, clique em **"Produtos"**
- Clique em **"Novo Produto"**
- Preencha e salve
- Verifique no Supabase se foi criado

### 4. Testar Upload de Imagem
- Ao criar produto, faça upload de imagem
- Verifique no Storage se apareceu

### 5. Testar CRUD de Módulos
- Clique em um produto
- Clique em **"Módulos"**
- Crie um módulo de vídeo ou PDF
- Salve e verifique

### 6. Testar Área do Aluno
- Crie uma compra manual no banco:
```sql
INSERT INTO purchases (user_id, product_id, status, approved_at)
VALUES (
  (SELECT id FROM profiles WHERE email = 'aluno@teste.com'),
  (SELECT id FROM products LIMIT 1),
  'approved',
  NOW()
);
```
- Faça login como aluno: `http://localhost:8080/auth/student-login`
- Acesse `/student` e veja os cursos

---

## ⚠️ Problemas Conhecidos

### Problema 1: "Invalid API Key"
**Causa:** Variável `VITE_SUPABASE_ANON_KEY` errada ou vazia
**Solução:** Verifique o `.env` e copie novamente do Supabase

### Problema 2: Upload falha
**Causa:** Buckets não criados ou políticas erradas
**Solução:** Verifique se os buckets existem e têm políticas

### Problema 3: Usuário não consegue acessar dashboard
**Causa:** Role não atribuída
**Solução:** Execute o SQL para atualizar a role para 'admin'

### Problema 4: Erros de permissão RLS
**Causa:** Políticas RLS muito restritivas
**Solução:** Verifique as políticas no SQL Editor

---

## 📞 Suporte

Se tiver problemas:

1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase (Logs → Postgres)
3. Revise este guia passo a passo
4. Teste os SQLs individualmente

---

**Feito! Agora seu projeto está 100% funcional! 🎉**
