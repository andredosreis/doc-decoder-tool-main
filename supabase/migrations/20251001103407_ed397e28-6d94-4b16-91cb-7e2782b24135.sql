-- ========================
-- 📊 SCHEMA DO BANCO DE DADOS
-- ========================
-- ONDE MUDAR: Se preferir outro banco, veja docs/DATABASE_ALTERNATIVES.md

-- ========================
-- 👤 PERFIS DE USUÁRIOS
-- ========================
-- Armazena dados adicionais dos usuários (auth.users não é acessível via API)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policy: Usuários podem ver seus próprios perfis
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Usuários podem atualizar seus próprios perfis
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ========================
-- 🔐 ROLES DE USUÁRIOS
-- ========================
-- SEGURANÇA: Roles em tabela separada (não no profile) para evitar escalação de privilégios
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function para verificar roles sem recursão RLS
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Policy: Usuários podem ver suas próprias roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- ========================
-- 📦 PRODUTOS (CURSOS)
-- ========================
-- ONDE MUDAR: Adicionar campos personalizados do produto
create table public.products (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  thumbnail_url text,
  price numeric(10,2),
  
  -- Configurações de integração de pagamento
  payment_platform text, -- 'hotmart', 'kiwify', etc.
  external_product_id text, -- ID do produto na plataforma externa
  webhook_secret text, -- Secret para validar webhooks
  
  -- Personalização (cores em HSL)
  theme_primary text default '217 91% 60%',
  theme_secondary text default '210 40% 96%',
  theme_accent text default '217 91% 55%',
  logo_url text,
  
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Policy: Admins podem ver/editar seus produtos
create policy "Admins can manage own products"
  on public.products for all
  using (
    auth.uid() = admin_id 
    or public.has_role(auth.uid(), 'admin')
  );

-- Policy: Usuários podem ver produtos ativos
create policy "Users can view active products"
  on public.products for select
  using (is_active = true);

-- ========================
-- 💳 COMPRAS
-- ========================
create type public.purchase_status as enum ('pending', 'approved', 'cancelled', 'refunded');

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  
  status purchase_status not null default 'pending',
  external_transaction_id text, -- ID da transação na plataforma de pagamento
  payment_platform text,
  amount_paid numeric(10,2),
  
  approved_at timestamptz,
  expires_at timestamptz, -- Para produtos com acesso temporário
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(user_id, product_id)
);

alter table public.purchases enable row level security;

-- Policy: Usuários veem suas próprias compras
create policy "Users can view own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- Policy: Admins veem compras de seus produtos
create policy "Admins can view product purchases"
  on public.purchases for select
  using (
    exists (
      select 1 from public.products
      where products.id = purchases.product_id
      and products.admin_id = auth.uid()
    )
  );

-- ========================
-- 📚 MÓDULOS DE CONTEÚDO
-- ========================
create type public.module_type as enum ('video', 'pdf', 'text', 'quiz');

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  
  title text not null,
  description text,
  type module_type not null,
  order_index integer not null default 0,
  
  -- URLs de conteúdo (armazenados no Supabase Storage)
  video_url text,
  pdf_url text,
  content_text text, -- Para módulos de texto
  
  -- Configurações
  is_preview boolean default false, -- Permitir preview sem comprar
  duration_seconds integer, -- Duração de vídeos
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules enable row level security;

-- Policy: Admins gerenciam módulos de seus produtos
create policy "Admins can manage product modules"
  on public.modules for all
  using (
    exists (
      select 1 from public.products
      where products.id = modules.product_id
      and products.admin_id = auth.uid()
    )
  );

-- Policy: Usuários veem módulos de produtos comprados
create policy "Users can view purchased modules"
  on public.modules for select
  using (
    -- Preview liberado OU comprou o produto
    modules.is_preview = true
    or exists (
      select 1 from public.purchases
      where purchases.product_id = modules.product_id
      and purchases.user_id = auth.uid()
      and purchases.status = 'approved'
      and (purchases.expires_at is null or purchases.expires_at > now())
    )
  );

-- ========================
-- 📊 PROGRESSO DO USUÁRIO
-- ========================
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  
  completed boolean default false,
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  last_position_seconds integer default 0, -- Posição do vídeo
  
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(user_id, module_id)
);

alter table public.user_progress enable row level security;

-- Policy: Usuários gerenciam seu próprio progresso
create policy "Users can manage own progress"
  on public.user_progress for all
  using (auth.uid() = user_id);

-- ========================
-- 🔄 TRIGGERS PARA TIMESTAMPS
-- ========================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.purchases
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.modules
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.user_progress
  for each row execute function public.handle_updated_at();

-- ========================
-- 🎯 TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- ========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  
  -- Criar role padrão de 'user'
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();