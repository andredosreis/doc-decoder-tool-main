# 🎓 Plataforma de Cursos Online - SaaS Multi-tenant

> Plataforma completa para criação e gestão de aplicativos de cursos online, similar ao Hotmart/Kiwify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Documentação Completa](#-documentação-completa)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

Esta é uma plataforma SaaS completa que permite a criação e gestão de aplicativos de cursos online. Cada administrador pode criar seu próprio app personalizado, adicionar produtos/cursos, gerenciar clientes e processar pagamentos através de múltiplas plataformas.

### 🌟 Características Principais

- **Multi-tenant**: Cada admin tem seu próprio app isolado
- **PWA**: Apps instaláveis em dispositivos móveis
- **Pagamentos**: Integração com Hotmart, Kiwify e Monetizze
- **Segurança**: Row Level Security (RLS) implementado
- **Realtime**: Atualizações em tempo real com Supabase
- **Customização**: Temas e cores personalizáveis por app

---

## ✨ Funcionalidades

### Para Administradores
- ✅ Criar e gerenciar múltiplos apps
- ✅ Upload de conteúdo (vídeos, PDFs, textos)
- ✅ Gestão de produtos e módulos
- ✅ Dashboard de vendas e analytics
- ✅ Gerenciamento de clientes
- ✅ Customização visual (logo, cores)
- ✅ Webhooks de pagamento configuráveis

### Para Clientes Finais
- ✅ Login/registro seguro
- ✅ Acesso a cursos comprados
- ✅ Player de vídeo integrado
- ✅ Visualizador de PDF
- ✅ Progresso de aulas salvo
- ✅ Certificados de conclusão
- ✅ App instalável (PWA)

### Sistema de Pagamentos
- ✅ Hotmart (webhook integrado)
- ✅ Kiwify (webhook integrado)
- ✅ Monetizze (webhook integrado)
- 🔄 Stripe (em desenvolvimento)
- 🔄 Mercado Pago (em desenvolvimento)
- 🔄 PIX nativo (planejado)

---

## 🛠️ Tecnologias

### Frontend
- **React** 18.3.1 - Biblioteca UI
- **TypeScript** 5.8.3 - Tipagem estática
- **Vite** 5.4.19 - Build tool
- **Tailwind CSS** 3.4.17 - Estilização
- **shadcn/ui** - Componentes UI (Radix UI)
- **React Router** 6.30.1 - Roteamento
- **TanStack Query** 5.83.0 - Gerenciamento de estado
- **Framer Motion** - Animações
- **Recharts** - Gráficos e analytics

### Backend & Infraestrutura
- **Lovable Cloud** - Plataforma de hospedagem
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Edge Functions** - Serverless (Deno)
- **Supabase Storage** - Armazenamento de arquivos
- **Row Level Security** - Segurança de dados

### DevOps & Ferramentas
- **Git** - Controle de versão
- **ESLint** - Linting
- **PostCSS** - Processamento CSS
- **Lovable Tagger** - Versionamento automático

---

## 📁 Estrutura do Projeto

```
doc-decoder-tool-main/
│
├── 📄 docs/                          # Documentação detalhada
│   ├── ARCHITECTURE.md               # Arquitetura do sistema
│   ├── DATABASE_ALTERNATIVES.md      # Guia de bancos de dados
│   ├── PAYMENT_INTEGRATION.md        # Integração de pagamentos
│   ├── TODO_PAYMENTS.md              # Roadmap de melhorias
│   ├── INSTALLATION.md               # ⭐ Guia de instalação
│   └── DEVELOPMENT.md                # ⭐ Guia de desenvolvimento
│
├── 🎨 src/
│   ├── components/                   # Componentes React
│   │   ├── Admin/                    # Painel administrativo
│   │   ├── Client/                   # Interface do cliente
│   │   ├── Auth/                     # Autenticação
│   │   └── ui/                       # Componentes shadcn
│   │
│   ├── pages/                        # Páginas/Rotas
│   │   ├── admin/                    # Área administrativa
│   │   └── app/                      # PWA do cliente
│   │
│   ├── services/                     # Lógica de negócio
│   │   ├── database.service.ts       # CRUD genérico
│   │   ├── apps.service.ts           # Gestão de apps
│   │   ├── products.service.ts       # Gestão de produtos
│   │   ├── storage.service.ts        # Upload de arquivos
│   │   └── webhooks.service.ts       # Integração pagamentos
│   │
│   ├── hooks/                        # Custom React Hooks
│   ├── contexts/                     # Estado global (Context API)
│   ├── config/                       # Configurações centralizadas
│   ├── types/                        # TypeScript types/interfaces
│   ├── utils/                        # Funções utilitárias
│   └── integrations/supabase/        # Cliente Supabase
│
├── ⚡ supabase/functions/            # Edge Functions (Serverless)
│   ├── webhook-payment/              # Processa webhooks de pagamento
│   ├── process-payment/              # Lógica de processamento
│   ├── create-checkout/              # Criação de checkout
│   ├── send-purchase-confirmation/   # Email de confirmação
│   ├── send-notification/            # Sistema de notificações
│   ├── generate-certificate/         # Geração de certificados
│   └── reset-user-password/          # Reset de senha
│
├── 🔧 Arquivos de Configuração
│   ├── package.json                  # Dependências
│   ├── tsconfig.json                 # Config TypeScript
│   ├── tailwind.config.ts            # Config Tailwind
│   ├── vite.config.ts                # Config Vite
│   └── .env.example                  # Variáveis de ambiente
│
└── 📱 public/                        # Arquivos estáticos
    ├── manifest.json                 # PWA manifest
    └── sw.js                         # Service Worker
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm))
- **npm** ou **yarn**
- **Git**
- **Conta Supabase** (gratuita)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/doc-decoder-tool.git
cd doc-decoder-tool

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

📚 **Para instruções detalhadas, veja [INSTALLATION.md](docs/INSTALLATION.md)**

---

## ⚙️ Configuração

### 1. Configuração do Supabase

```bash
# Crie um projeto em https://supabase.com
# Copie as credenciais para o .env
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Deploy das Edge Functions

```bash
# Instale o Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-id

# Deploy das functions
supabase functions deploy
```

### 4. Configuração de Webhooks

Configure os webhooks nas plataformas de pagamento:

**URL do Webhook:**
```
https://seu-projeto.supabase.co/functions/v1/webhook-payment
```

📚 **Para configuração completa, veja [docs/PAYMENT_INTEGRATION.md](docs/PAYMENT_INTEGRATION.md)**

---

## 📚 Documentação Completa

### Guias Principais

| Documento | Descrição |
|-----------|-----------|
| [INSTALLATION.md](docs/INSTALLATION.md) | Guia completo de instalação |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Guia de desenvolvimento |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura técnica detalhada |
| [PAYMENT_INTEGRATION.md](docs/PAYMENT_INTEGRATION.md) | Integração de pagamentos |
| [DATABASE_ALTERNATIVES.md](docs/DATABASE_ALTERNATIVES.md) | Alternativas de banco de dados |
| [TODO_PAYMENTS.md](docs/TODO_PAYMENTS.md) | Roadmap de melhorias |

### Estrutura do Banco de Dados

#### Tabelas Principais

- **`apps`** - Aplicativos criados pelos administradores
- **`products`** - Produtos/Cursos dentro de cada app
- **`modules`** - Módulos/Aulas dos produtos
- **`customers`** - Clientes que compraram acesso
- **`customer_progress`** - Progresso dos clientes nas aulas

📊 **Diagrama completo em [ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP (Concluído)
- [x] Sistema de autenticação
- [x] CRUD de apps e produtos
- [x] Upload de conteúdo
- [x] Player de vídeo/PDF
- [x] Sistema de progresso
- [x] Webhooks Hotmart/Kiwify/Monetizze
- [x] PWA básico

### 🚀 Fase 2 - Pagamentos Avançados (2-3 semanas)
- [ ] Integração Stripe
- [ ] Integração Mercado Pago
- [ ] PIX nativo (Asaas/Gerencianet)
- [ ] Dashboard de vendas
- [ ] Sistema de cupons

### 🎯 Fase 3 - Features Premium (3-4 semanas)
- [ ] Sistema de afiliados
- [ ] Assinaturas recorrentes
- [ ] Analytics avançado
- [ ] Checkout otimizado
- [ ] Recuperação de carrinho

### 💡 Fase 4 - Expansão (Ongoing)
- [ ] Internacionalização
- [ ] Split de pagamento
- [ ] WhatsApp notifications
- [ ] Email marketing
- [ ] Gamificação

📋 **Detalhes em [TODO_PAYMENTS.md](docs/TODO_PAYMENTS.md)**

---

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Build de produção
npm run build:dev        # Build de desenvolvimento
npm run preview          # Preview do build

# Linting
npm run lint             # Executa ESLint
```

---

## 🌐 Deploy

### Deploy Automático (Lovable)

Qualquer mudança no código é automaticamente deployed pela plataforma Lovable.

### Deploy Manual

```bash
# Build
npm run build

# Deploy para Lovable
# Vá em: Settings → Deploy → Publish
```

### Domínio Customizado

1. Acesse: **Project > Settings > Domains**
2. Clique em **Connect Domain**
3. Configure CNAME: `seu-dominio.com` → `seuapp.lovable.app`

📚 [Guia completo de deploy](https://docs.lovable.dev/features/custom-domain)

---

## 🔒 Segurança

### Implementado
- ✅ Row Level Security (RLS) no PostgreSQL
- ✅ Validação de webhooks com assinaturas
- ✅ HTTPS obrigatório em todas as requisições
- ✅ Secrets seguros no Supabase
- ✅ Sanitização de inputs
- ✅ Proteção contra SQL Injection

### Boas Práticas
- 🔐 Nunca exponha suas chaves secretas
- 🔐 Sempre valide webhooks com assinaturas
- 🔐 Use ambiente sandbox para testes
- 🔐 Mantenha dependências atualizadas
- 🔐 Implemente rate limiting em produção

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

### Convenções de Código

- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Serviços**: camelCase com `.service.ts` (`apps.service.ts`)
- **Hooks**: camelCase com prefixo `use` (`useProducts.tsx`)
- **Types**: PascalCase com sufixo (`ProductType`)

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor Principal** - [Seu Nome](https://github.com/seu-usuario)

---

## 📞 Suporte

- 📧 Email: suporte@seudominio.com
- 💬 Discord: [Link do servidor]
- 📖 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/doc-decoder-tool/issues)

---

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de hospedagem
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

## 📊 Status do Projeto

![GitHub last commit](https://img.shields.io/github/last-commit/seu-usuario/doc-decoder-tool)
![GitHub issues](https://img.shields.io/github/issues/seu-usuario/doc-decoder-tool)
![GitHub pull requests](https://img.shields.io/github/issues-pr/seu-usuario/doc-decoder-tool)

---

**Feito com ❤️ usando React + TypeScript + Supabase**
