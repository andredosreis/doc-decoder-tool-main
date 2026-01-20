# 📦 Guia de Instalação Completo

Este guia fornece instruções detalhadas para instalar e configurar a plataforma de cursos online.

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Instalação Local](#-instalação-local)
3. [Configuração do Supabase](#-configuração-do-supabase)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)
5. [Deploy das Edge Functions](#-deploy-das-edge-functions)
6. [Configuração de Webhooks](#-configuração-de-webhooks)
7. [Verificação da Instalação](#-verificação-da-instalação)
8. [Troubleshooting](#-troubleshooting)

---

## 🛠️ Pré-requisitos

### Software Necessário

#### 1. Node.js (versão 18 ou superior)

**Instalação com nvm (recomendado):**
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reiniciar o terminal e instalar Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Verificar instalação
node --version  # deve mostrar v18.x.x
npm --version   # deve mostrar 9.x.x ou superior
```

**Instalação direta:**
- 🍎 **macOS**: [nodejs.org](https://nodejs.org/) ou `brew install node@18`
- 🪟 **Windows**: [nodejs.org](https://nodejs.org/) ou Chocolatey
- 🐧 **Linux**: Use o gerenciador de pacotes da sua distro

#### 2. Git

```bash
# Verificar se já está instalado
git --version

# Se não estiver instalado:
# macOS: brew install git
# Ubuntu/Debian: sudo apt-get install git
# Windows: https://git-scm.com/download/win
```

#### 3. Editor de Código (Opcional)

- **Visual Studio Code** (recomendado): [code.visualstudio.com](https://code.visualstudio.com/)
- **WebStorm**
- **Sublime Text**

### Contas Necessárias

#### 1. Conta Supabase (Gratuita)
- Acesse: [supabase.com](https://supabase.com)
- Clique em "Start your project"
- Faça login com GitHub, Google ou email

#### 2. Conta GitHub (Para deploy)
- Acesse: [github.com](https://github.com)
- Crie uma conta gratuita

---

## 💻 Instalação Local

### Passo 1: Clone o Repositório

```bash
# Clone via HTTPS
git clone https://github.com/seu-usuario/doc-decoder-tool.git

# OU clone via SSH (se configurado)
git clone git@github.com:seu-usuario/doc-decoder-tool.git

# Entre no diretório
cd doc-decoder-tool
```

### Passo 2: Instale as Dependências

```bash
# Usando npm
npm install

# OU usando yarn
yarn install

# OU usando pnpm
pnpm install
```

**⏱️ Tempo estimado:** 2-5 minutos (dependendo da conexão)

### Passo 3: Verifique a Instalação

```bash
# Listar dependências instaladas
npm list --depth=0

# Verificar se há vulnerabilidades
npm audit
```

---

## 🗄️ Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `plataforma-cursos` (ou nome de sua escolha)
   - **Database Password**: Crie uma senha forte e salve
   - **Region**: Escolha a mais próxima (ex: São Paulo)
   - **Plan**: Free (para começar)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos para provisionamento

### Passo 2: Obter Credenciais

1. No painel do projeto, vá em **Settings** → **API**
2. Copie os seguintes valores:

```
Project URL: https://[seu-projeto].supabase.co
anon public key: eyJhbG...
service_role key: eyJhbG... (mantenha secreto!)
```

### Passo 3: Criar Tabelas do Banco de Dados

#### Opção A: SQL Editor (Recomendado)

1. No Supabase, vá em **SQL Editor**
2. Clique em **"New Query"**
3. Cole o seguinte SQL:

```sql
-- 1. Tabela de Apps
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  theme_colors JSONB DEFAULT '{}',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  "order" INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela de Módulos
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'text', 'quiz')),
  content_url TEXT,
  duration INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  purchase_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabela de Progresso
CREATE TABLE customer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_watched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, module_id)
);

-- Índices para performance
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_products_app_id ON products(app_id);
CREATE INDEX idx_modules_product_id ON modules(product_id);
CREATE INDEX idx_customers_app_id ON customers(app_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_progress_customer ON customer_progress(customer_id);
CREATE INDEX idx_progress_module ON customer_progress(module_id);
```

4. Clique em **"Run"** para executar

#### Opção B: Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref [seu-project-ref]

# Aplicar migrations (se houver arquivo de migration)
supabase db push
```

### Passo 4: Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para Apps
CREATE POLICY "Users can view their own apps"
  ON apps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own apps"
  ON apps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own apps"
  ON apps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own apps"
  ON apps FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para Products (público para leitura, apenas dono pode editar)
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (is_published = true);

CREATE POLICY "App owners can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = products.app_id
      AND apps.user_id = auth.uid()
    )
  );

-- Políticas para Modules
CREATE POLICY "Anyone can view modules of published products"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = modules.product_id
      AND products.is_published = true
    )
  );

CREATE POLICY "Product owners can manage modules"
  ON modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN apps ON apps.id = products.app_id
      WHERE products.id = modules.product_id
      AND apps.user_id = auth.uid()
    )
  );

-- Políticas para Customers
CREATE POLICY "App owners can view their customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM apps
      WHERE apps.id = customers.app_id
      AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their own data"
  ON customers FOR SELECT
  USING (email = auth.email());

-- Políticas para Progress
CREATE POLICY "Customers can view their own progress"
  ON customer_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_progress.customer_id
      AND customers.email = auth.email()
    )
  );

CREATE POLICY "Customers can update their own progress"
  ON customer_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_progress.customer_id
      AND customers.email = auth.email()
    )
  );

CREATE POLICY "Customers can update their progress"
  ON customer_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = customer_progress.customer_id
      AND customers.email = auth.email()
    )
  );
```

### Passo 5: Configurar Storage

1. No Supabase, vá em **Storage**
2. Clique em **"Create bucket"**
3. Crie os seguintes buckets:

**Bucket: `products`**
- Name: `products`
- Public: ✅ (para imagens de produtos)
- File size limit: 50MB
- Allowed MIME types: `image/*`

**Bucket: `content`**
- Name: `content`
- Public: ✅ (para vídeos e PDFs)
- File size limit: 500MB
- Allowed MIME types: `video/*, application/pdf`

**Bucket: `avatars`**
- Name: `avatars`
- Public: ✅
- File size limit: 2MB
- Allowed MIME types: `image/*`

---

## 🔐 Variáveis de Ambiente

### Passo 1: Criar Arquivo .env

```bash
# Na raiz do projeto, crie o arquivo .env
touch .env
```

### Passo 2: Adicionar Variáveis

Abra o arquivo `.env` e adicione:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Opcional: Para desenvolvimento local
VITE_APP_NAME=Plataforma de Cursos
VITE_APP_URL=http://localhost:5173

# Opcional: Para analytics
VITE_ENABLE_ANALYTICS=false
```

### Passo 3: Criar .env.example (Para compartilhar)

```bash
# Crie um exemplo sem valores sensíveis
cp .env .env.example
```

Edite `.env.example` e remova os valores:

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App Config
VITE_APP_NAME=Plataforma de Cursos
VITE_APP_URL=http://localhost:5173
VITE_ENABLE_ANALYTICS=false
```

### Passo 4: Adicionar ao .gitignore

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep .env

# Se não estiver, adicione:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## ⚡ Deploy das Edge Functions

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase

# Verificar instalação
supabase --version
```

### Passo 2: Login no Supabase

```bash
supabase login

# Abrirá o navegador para autorização
```

### Passo 3: Link ao Projeto

```bash
# Obter o project-ref no Supabase Dashboard (Settings → General)
supabase link --project-ref seu-project-ref

# Confirmar quando solicitado
```

### Passo 4: Deploy das Functions

```bash
# Deploy de todas as functions
supabase functions deploy

# OU deploy individual
supabase functions deploy webhook-payment
supabase functions deploy process-payment
supabase functions deploy send-purchase-confirmation
```

### Passo 5: Configurar Secrets

```bash
# Configurar secrets para as Edge Functions
supabase secrets set HOTMART_SECRET=seu-secret-hotmart
supabase secrets set KIWIFY_SECRET=seu-secret-kiwify
supabase secrets set MONETIZZE_SECRET=seu-secret-monetizze

# Verificar secrets configurados
supabase secrets list
```

---

## 🔗 Configuração de Webhooks

### URL do Webhook

Sua URL de webhook será:
```
https://seu-projeto.supabase.co/functions/v1/webhook-payment
```

### Hotmart

1. Acesse [app-vlc.hotmart.com](https://app-vlc.hotmart.com)
2. Vá em **Ferramentas** → **Webhook**
3. Clique em **Configurar**
4. Cole a URL do webhook
5. Selecione os eventos:
   - ✅ Compra aprovada
   - ✅ Compra cancelada
   - ✅ Reembolso
6. Salve e copie o **secret** para usar no Supabase

### Kiwify

1. Acesse [kiwify.app](https://kiwify.app)
2. Vá em **Configurações** → **Webhooks**
3. Clique em **Adicionar Webhook**
4. Cole a URL e selecione eventos
5. Copie o secret

### Monetizze

1. Acesse [monetizze.com.br](https://monetizze.com.br)
2. Vá em **Configurações** → **Postback**
3. Cole a URL do webhook
4. Configure os eventos desejados

---

## ✅ Verificação da Instalação

### Teste 1: Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

**Resultado esperado:**
```
VITE v5.4.19  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Teste 2: Acessar Aplicação

1. Abra o navegador em `http://localhost:5173`
2. Você deve ver a landing page
3. Tente fazer login/registro

### Teste 3: Verificar Conexão com Supabase

```bash
# No console do navegador (F12), execute:
console.log('Supabase conectado:', supabase.auth.getSession())
```

### Teste 4: Build de Produção

```bash
npm run build

# Resultado esperado: pasta dist/ criada
ls dist/
```

---

## 🐛 Troubleshooting

### Problema: "Module not found"

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Supabase connection failed"

**Causas comuns:**
1. URL ou chave incorreta no `.env`
2. Projeto Supabase não provisionado completamente
3. Firewall bloqueando conexão

**Solução:**
```bash
# Verificar variáveis
cat .env

# Testar conexão
curl https://seu-projeto.supabase.co/rest/v1/
```

### Problema: "Port 5173 already in use"

**Solução:**
```bash
# Usar outra porta
npm run dev -- --port 3000

# OU matar o processo na porta 5173
lsof -ti:5173 | xargs kill -9
```

### Problema: Edge Functions não funcionam

**Solução:**
```bash
# Verificar se está linkado ao projeto correto
supabase projects list

# Re-deploy
supabase functions deploy --no-verify-jwt

# Ver logs
supabase functions logs webhook-payment
```

### Problema: "CORS error"

**Solução:**
1. No Supabase, vá em **Settings** → **API**
2. Em **CORS**, adicione: `http://localhost:5173`
3. Reinicie o servidor de dev

---

## 🎉 Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Leia [DEVELOPMENT.md](DEVELOPMENT.md) para começar a desenvolver
2. ✅ Configure os webhooks de pagamento
3. ✅ Customize as cores e logo do app
4. ✅ Crie seu primeiro produto de teste

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os [Issues](https://github.com/seu-usuario/doc-decoder-tool/issues) existentes
2. Consulte a [documentação do Supabase](https://supabase.com/docs)
3. Abra um novo issue descrevendo o problema

---

**Instalação concluída com sucesso!** 🚀
