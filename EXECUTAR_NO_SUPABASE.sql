-- ============================================================
-- 🗑️ SCRIPT COMPLETO: LIMPAR E RECRIAR BANCO DO ZERO
-- ============================================================
-- ATENÇÃO: Este script APAGA todas as tabelas e recria!
-- Execute apenas se você quer começar do zero.
-- ============================================================


-- ============================================================
-- PARTE 1: LIMPAR TUDO (DROP)
-- ============================================================

-- Remover triggers primeiro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at ON public.products;
DROP TRIGGER IF EXISTS set_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS set_updated_at ON public.modules;
DROP TRIGGER IF EXISTS set_updated_at ON public.user_progress;
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

-- Remover funções
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS generate_certificate_number() CASCADE;

-- Remover tabelas (ordem importa por causa das foreign keys)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remover tipos enum
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.purchase_status CASCADE;
DROP TYPE IF EXISTS public.module_type CASCADE;


-- ============================================================
-- PARTE 2: CRIAR TABELAS DO ZERO
-- ============================================================

-- 👤 PERFIS DE USUÁRIOS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 🔐 ROLES DE USUÁRIOS (usando TEXT em vez de ENUM para simplicidade)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar roles (usando TEXT)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);


-- 📦 PRODUTOS (CURSOS)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price NUMERIC(10,2),
  payment_platform TEXT,
  external_product_id TEXT,
  webhook_secret TEXT,
  theme_primary TEXT DEFAULT '217 91% 60%',
  theme_secondary TEXT DEFAULT '210 40% 96%',
  theme_accent TEXT DEFAULT '217 91% 55%',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = admin_id);

CREATE POLICY "Users can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE);


-- 💳 COMPRAS
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled', 'refunded')),
  external_transaction_id TEXT,
  payment_platform TEXT,
  amount_paid NUMERIC(10,2),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view product purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = purchases.product_id
      AND products.admin_id = auth.uid()
    )
  );


-- 📚 MÓDULOS DE CONTEÚDO
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'text', 'quiz')),
  order_index INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  pdf_url TEXT,
  content_text TEXT,
  thumbnail_url TEXT,
  is_preview BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product modules"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = modules.product_id
      AND products.admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can view purchased modules"
  ON public.modules FOR SELECT
  USING (
    modules.is_preview = TRUE
    OR EXISTS (
      SELECT 1 FROM public.purchases
      WHERE purchases.product_id = modules.product_id
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'approved'
      AND (purchases.expires_at IS NULL OR purchases.expires_at > NOW())
    )
  );


-- 📊 PROGRESSO DO USUÁRIO
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = user_id);


-- 🏆 CERTIFICADOS
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view product certificates"
  ON public.certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = certificates.product_id
      AND products.admin_id = auth.uid()
    )
  );


-- 🔔 NOTIFICAÇÕES
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- PARTE 3: TRIGGERS E FUNÇÕES
-- ============================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Trigger para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Criar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Função para gerar número de certificado
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN new_number;
END;
$$;


-- ============================================================
-- PARTE 4: CONFIGURAR ADMIN EXISTENTE (SE HOUVER)
-- ============================================================

DO $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Verificar se existe algum usuário em auth.users
  FOR admin_user IN SELECT id, email FROM auth.users LOOP
    -- Inserir profile se não existir
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (admin_user.id, admin_user.email, 'Usuário')
    ON CONFLICT (id) DO NOTHING;
    
    -- Inserir role de user se não existir
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Usuário configurado: %', admin_user.email;
  END LOOP;
END $$;


-- ============================================================
-- PARTE 5: TORNAR admin@teste.com ADMIN (se existir)
-- ============================================================

UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'admin@teste.com');


-- ============================================================
-- ✅ VERIFICAÇÃO FINAL
-- ============================================================

SELECT '✅ Tabelas criadas com sucesso!' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;


-- ============================================================
-- 📋 PRÓXIMOS PASSOS:
-- ============================================================
-- 1. Vá em Storage → New bucket
-- 2. Crie bucket "product-images" (marque como Public ✅)
-- 3. Crie bucket "module-content" (marque como Public ✅)
-- 4. Teste o login!
-- ============================================================
