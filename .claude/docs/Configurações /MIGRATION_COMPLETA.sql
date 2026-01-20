-- ============================================================
-- 🚀 MIGRATION COMPLETA - Plataforma de Cursos Online
-- ============================================================
-- Este arquivo consolida TODAS as migrations em ordem
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- MIGRATION 1: Schema Principal do Banco de Dados
-- ============================================================

-- ========================
-- 👤 PERFIS DE USUÁRIOS
-- ========================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========================
-- 🔐 ROLES DE USUÁRIOS
-- ========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policy: Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ========================
-- 📦 PRODUTOS (CURSOS)
-- ========================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  price numeric(10,2),

  -- Configurações de integração de pagamento
  payment_platform text,
  external_product_id text,
  webhook_secret text,

  -- Personalização (cores em HSL)
  theme_primary text DEFAULT '217 91% 60%',
  theme_secondary text DEFAULT '210 40% 96%',
  theme_accent text DEFAULT '217 91% 55%',
  logo_url text,

  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver/editar seus produtos
CREATE POLICY "Admins can manage own products"
  ON public.products FOR ALL
  USING (
    auth.uid() = admin_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- Policy: Usuários podem ver produtos ativos
CREATE POLICY "Users can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- ========================
-- 💳 COMPRAS
-- ========================
CREATE TYPE public.purchase_status AS ENUM ('pending', 'approved', 'cancelled', 'refunded');

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

  status purchase_status NOT NULL DEFAULT 'pending',
  external_transaction_id text,
  payment_platform text,
  amount_paid numeric(10,2),

  approved_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, product_id)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem suas próprias compras
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins veem compras de seus produtos
CREATE POLICY "Admins can view product purchases"
  ON public.purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = purchases.product_id
      AND products.admin_id = auth.uid()
    )
  );

-- ========================
-- 📚 MÓDULOS DE CONTEÚDO
-- ========================
CREATE TYPE public.module_type AS ENUM ('video', 'pdf', 'text', 'quiz');

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,

  title text NOT NULL,
  description text,
  type module_type NOT NULL,
  order_index integer NOT NULL DEFAULT 0,

  -- URLs de conteúdo
  video_url text,
  pdf_url text,
  content_text text,
  thumbnail_url text,

  -- Configurações
  is_preview boolean DEFAULT false,
  duration_seconds integer,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins gerenciam módulos de seus produtos
CREATE POLICY "Admins can manage product modules"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = modules.product_id
      AND products.admin_id = auth.uid()
    )
  );

-- Policy: Usuários veem módulos de produtos comprados
CREATE POLICY "Users can view purchased modules"
  ON public.modules FOR SELECT
  USING (
    modules.is_preview = true
    OR EXISTS (
      SELECT 1 FROM public.purchases
      WHERE purchases.product_id = modules.product_id
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'approved'
      AND (purchases.expires_at IS NULL OR purchases.expires_at > now())
    )
  );

-- ========================
-- 📊 PROGRESSO DO USUÁRIO
-- ========================
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,

  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position_seconds integer DEFAULT 0,

  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários gerenciam seu próprio progresso
CREATE POLICY "Users can manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = user_id);

-- ========================
-- 🔄 TRIGGERS PARA TIMESTAMPS
-- ========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

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

-- ========================
-- 🎯 TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );

  -- Criar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MIGRATION 2: Storage Policies - Product Images
-- ============================================================

-- Permitir upload de imagens de produtos para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização pública das imagens
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Usuários podem atualizar suas imagens"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem suas próprias imagens
CREATE POLICY "Usuários podem deletar suas imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- MIGRATION 3: Storage Policies - Module Content
-- ============================================================

-- Permitir upload de vídeos e PDFs para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de conteúdo de módulos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'module-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus arquivos de módulos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'module-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'module-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus arquivos de módulos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'module-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar conteúdo de módulos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'module-content');

-- ============================================================
-- MIGRATION 4: Module Content Policies Refinement
-- ============================================================

-- Tornar o bucket module-content público
UPDATE storage.buckets
SET public = true
WHERE id = 'module-content';

-- Políticas refinadas de acesso ao conteúdo
CREATE POLICY "Admins podem visualizar todo o conteúdo do módulo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'module-content' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Usuários podem visualizar conteúdo de módulos que compraram"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'module-content' AND (
    -- Se for um módulo preview, todos podem ver
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.pdf_url LIKE '%' || storage.objects.name || '%'
      AND modules.is_preview = true
    )
    OR
    -- Se o usuário comprou o produto, pode ver
    EXISTS (
      SELECT 1 FROM modules
      INNER JOIN purchases ON purchases.product_id = modules.product_id
      WHERE modules.pdf_url LIKE '%' || storage.objects.name || '%'
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'approved'
    )
  )
);

CREATE POLICY "Admins podem deletar conteúdo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'module-content' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================================
-- MIGRATION 5: Add Thumbnail to Modules
-- ============================================================

-- Já foi adicionado na tabela principal, então esta migration é redundante
-- mas mantida para histórico

-- ============================================================
-- MIGRATION 6: Certificates Table
-- ============================================================

CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios certificados
CREATE POLICY "Users can view own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins podem ver certificados de seus produtos
CREATE POLICY "Admins can view product certificates"
ON public.certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = certificates.product_id
    AND products.admin_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para gerar número do certificado
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
-- MIGRATION 7: Notifications Table
-- ============================================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver suas próprias notificações
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias notificações
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- ✅ MIGRATION COMPLETA - FINALIZADA
-- ============================================================
-- Próximos passos:
-- 1. Criar os buckets: product-images e module-content no Storage
-- 2. Criar primeiro usuário admin
-- 3. Testar funcionalidades
-- ============================================================
