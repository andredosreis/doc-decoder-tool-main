# ESPECIFICAÇÃO TÉCNICA COMPLETA -PLATAFORMA DE CRIAÇÃO DE APPS PARA PRODUTOS DIGITAIS 

Baseado na análise do vídeo: https://www.youtube.com/watch?v=9W5PCG9YEyE 

Plataforma de referência: AppSell 

Data de análise: 1 de Outubro de 2025 

# 1. ANÁLISE DETALHADA DO VÍDEO 

# 1.1 Tipo de Plataforma 

A plataforma demonstrada é uma solução SaaS (Software as a Service) no-code para criação e gestão de aplicativos móveis voltados para venda e entrega de produtos digitais (infoprodutos). 

Propósito principal: 

- Transformar e-books, cursos online e outros conteúdos digitais em aplicativos móveis profissionais - Melhorar a experiência de entrega de produtos digitais - Aumentar taxas de conversão e reduzir reembolsos - Facilitar upsells, downsells e vendas adicionais 

Diferenciais competitivos: 

- Acesso direto sem necessidade de login repetido em plataformas web - Interface mais profissional e engajadora - Capacidade de monetização através de upsells integrados - Sistema de controle de acesso e liberação programada de conteúdo 

# 1.2 Funcionalidades Principais 

## 1.2.1 Criação e Customização de Apps 

Tela de Login: 

- Upload de imagem de fundo personalizada - Upload de logo da marca - Customização de headline/título de boas-vindas - Personalização de cores de botões e texto - Ajuste de tamanho do logo - Campos de email e senha - Botão “Criar Conta” 

Tela Home (Inicial): 

- Banner rotativo com links (carrossel) - Estilos de visualização de produtos: - Estilo Original (grid tradicional) - Estilo Netflix (cards horizontais com scroll) - Configuração de número de colunas para produtos 

# 1- Cores personalizáveis para títulos - Opção de gradiente de fundo - Disposição de produtos (Liberados/Bloqueados/Bônus) - Nomeação customizável de seções de produtos 

Dados Gerais: 

- Nome do aplicativo - Seleção de idioma (PT, EN, ES, IT, FR, DE, JP) - Tipos de login (completo, direto, facilitado) - Descrição do app - Email de suporte - Toggle para botão de página de vendas - Toggle para exibição de evolução do curso - Integração com WhatsApp para suporte 

## 1.2.2 Gestão de Produtos 

Criação de Produtos: 

- Associação de produto a um app específico - Nome do produto (com opção de ocultar) - Regras de liberação de acesso: - Imediato - Data exata - Dias após compra - Tipos de oferta: - Produto Principal - Order Bump - Upsell/Downsell - Bônus - Ordem de exibição - Layout em colunas para módulos - ID do produto (integração com plataformas externas) - URL de redirecionamento para página de vendas - Upload de logos (liberado e bloqueado) 

Gestão de Conteúdo: 

- Criação de módulos dentro de produtos - Múltiplos formatos de conteúdo suportados: - Arquivo incorporado (PDF, DOC, PPT) - Download de arquivo - Áudio - Editor de texto - HTML customizado - Link externo - Página web - PDF do Google Drive - Vídeos Vimeo - Vídeos Panda - VSL Play/Host VSL - YouTube (com opção de ocultar player) - Imagem de capa para cada módulo 

# 2- Controle de tempo de liberação - Opção de abertura direta ou com capa customizada 

## 1.2.3 Monetização e Vendas 

Features de Monetização: 

- Sistema de upsells/downsells integrado no app - Produtos bloqueados com redirecionamento para página de vendas - Ofertas de bônus para engajamento - Consultorias individuais promovidas dentro do app - Produtos complementares sugeridos 

Integração com Plataformas de Pagamento: 

- Hotmart - Monetizze - Kiwify - Braip - Outras plataformas via ID de produto 

Analytics e Tracking: 

- Estatísticas de vendas em tempo real - Tracking de operações - Relatórios de acesso 

## 1.2.4 Engajamento e Retenção 

Recursos de Engajamento: 

- Push notifications para novos conteúdos e promoções - Sistema de progresso de curso/treinamento - Marcação de conclusão de módulos - Gamificação através de “semanas” de desafios - Bônus e presentes para usuários 

Prevenção de Reembolsos: 

- Conteúdo integrado diretamente no app (não facilmente extraível) - Gestão de acesso centralizada - Melhor experiência de usuário reduz insatisfação 

## 1.2.5 Publicação e Distribuição 

Distribuição: 

- Link de acesso direto para instalação - Instalação na tela inicial do smartphone - Publicação em App Stores (iOS e Android) - Domínio personalizado - Design responsivo (mobile e desktop) 

Suporte ao Cliente: 

- Sistema de recuperação automática de acesso via email - Email para clientes inativos após período configurável - Botão de WhatsApp integrado - Email de suporte configurável 

# 31.3 Recursos e Features Observados 

## Features de Interface do Usuário: 

Dashboard Administrativo: 

- Menu lateral com navegação principal - Seções: Apps, Produtos, Vendas, Integrações, Meus Clientes, Suporte, Afiliados, Aulas - Interface visual intuitiva com drag-and-drop implícito - Preview em tempo real do app sendo criado 

Editor Visual: 

- WYSIWYG (What You See Is What You Get) - Painéis de customização organizados por abas - Upload de mídia com preview - Seletor de cores com paleta - Campos de texto com validação 

Sistema de Módulos: 

- Estrutura hierárquica: App → Produtos → Módulos → Conteúdo - Reordenação drag-and-drop - Clone e duplicação de elementos - Arquivamento/exclusão de produtos 

## Features Técnicas: 

Multi-tenancy: 

- Cada usuário pode criar múltiplos apps - Isolamento de dados por usuário - Gestão independente de produtos 

Sistema de Permissões: 

- Controle de acesso baseado em compra - Liberação programada de conteúdo - Bloqueio de produtos não adquiridos 

Internacionalização: 

- Suporte a 7 idiomas - Interface adaptável ao idioma selecionado 

Responsividade: 

- App funciona em smartphones (iOS/Android) - Preview desktop funcional - Menu adaptativo para diferentes telas 1. 2. 3. 1. 2. 3. 4. 

# 41.4 Interface do Usuário - Fluxo Detalhado 

## Fluxo do Criador (Admin): 

1. Login no AppSell ↓2. Dashboard Principal ↓3. Criar Novo App ├── Configurar Tela Login ├── Configurar Tela Home └── Preencher Dados Gerais ↓4. Criar Produtos ├── Definir tipo de oferta ├── Configurar regras de acesso └── Upload de imagens ↓5. Adicionar Módulos de Conteúdo ├── Escolher formato ├── Upload/Link de conteúdo └── Configurar liberação ↓6. Publicar App ↓7. Distribuir Link de Acesso ↓8. Monitorar Vendas e Engajamento 

## Fluxo do Usuário Final (Cliente): 

1. Receber Link de Acesso ↓2. Instalar App na Tela Inicial ↓3. Login (Email + Senha) ↓4. Visualizar Home Screen ├── Banner rotativo ├── Produtos liberados └── Produtos bloqueados (upsells) ↓5. Acessar Produto Comprado ↓6. Navegar por Módulos ├── Ver progresso ├── Marcar como concluído └── Consumir cont eúdo ↓7. Interagir com Upsells (opcional) └── Redirecionar para página de vendas ↓8. Acessar Bônus e Suporte 

# 51.5 Fluxo de Trabalho da Aplicação 

## Fluxo de Dados - Criação de App: 

graph TD A[Usuário cria conta no AppSell] --> B[Acessa Dashboard] B --> C[Clica em 'Criar Novo App'] C --> D[Configuração Visual] D --> D1[Tela Login] D --> D2[Tela Home] D --> D3[Dados Gerais] D1 --> E[Salva Configurações] D2 --> ED3 --> EE --> F[Criar Produtos] F --> G[Adicionar ID de plataforma externa] G --> H[Configurar tipo de oferta] H --> I[Upload de imagens] I --> J[Criar Módulos de Conteúdo] J --> K[Upload/Link de conteúdo] K --> L[Publicar App] L --> M[Gerar Link de Acesso] M --> N[Distribuir para Clientes] 

## Fluxo de Autenticação e Acesso: 

sequenceDiagram participant U as Usuário participant A as App Mobile participant API as Backend API participant P as Plataforma Pagamento participant DB as Database U->>A: Insere email/senha A->>API: POST /auth/login API->>DB: Verifica credenciais DB-->>API: Credenciais válidas API->>P: Verifica compras do usuário P-->>API: Lista de produtos comprados API->>DB: Busca conteúdo autorizado DB-->>API: Conteúdo liberado API-->>A: Token + Lista de produtos A-->>U: Exibe home com produtos 

## Fluxo de Liberação de Conteúdo: 

graph LR A[Compra realizada] --> B{Regra de liberação?} B -->|Imediato| C[Libera conteúdo] B -->|Data específica| D[Agenda liberação] B -->|Dias após compra| E[Calcula data] D --> F[Cron job verifica datas] E --> FF --> G{Data alcançada?} G -->|Sim| CG -->|Não| H[Mantém bloqueado] C --> I[Push notification] I --> J[Email de notificação] 

# 61.6 Integrações e Serviços Externos 

## 1.6.1 Plataformas de Pagamento e Infoprodutos: 

Plataforma Tipo Integração Hotmart Marketplace de produtos di‐ gitais ID de produto para validação de compra 

Monetizze Afiliados e produtos digitais ID de produto + webhook de compra 

Kiwify Checkout e vendas ID de produto (demonstrado no vídeo) 

Braip Plataforma de afiliados ID de produto + API de valid‐ ação 

Dados trocados: 

- ID do produto - Email do comprador - Status da compra - Data da transação - Tipo de produto (principal, upsell, etc.) 

## 1.6.2 Serviços de Hospedagem de Conteúdo: 

Serviço Tipo de Conteúdo Uso Google Drive PDFs, documentos Hospedagem de e-books e materiais 

Vimeo Vídeos Aulas e tutoriais em vídeo 

Panda Videos Vídeos Plataforma brasileira de vídeo 

VSL Play/Host VSL Video Sales Letters Vídeos de vendas 

YouTube Vídeos públicos/privados Embeds com player oculto opcional 

## 1.6.3 Ferramentas de Design e Produtividade: 

Canva: Criação de logos, banners e imagens de produtos 

WhatsApp Business API: Suporte direto ao cliente 

Email Service Providers: Recuperação de acesso e notificações 

## 1.6.4 Infraestrutura de Publicação: 

Apple App Store: Publicação de apps iOS 

Google Play Store: Publicação de apps Android •••••

# 7PWA (Progressive Web App): Alternativa para instalação direta 

## 1.6.5 Webhooks e APIs: 

Webhooks recebidos: 

- Notificações de compra das plataformas de pagamento - Notificações de reembolso - Atualizações de status de assinatura 

APIs consumidas: 

- Validação de compras em tempo real - Verificação de status de produto - Consulta de dados do cliente 

# 2. ESPECIFICAÇÃO TÉCNICA 

# 2.1 Arquitetura e Tech Stack 

## 2.1.1 Frontend - Aplicativo Móvel 

Recomendação: React Native com TypeScript Justificativa: 

- ✅ Single codebase para iOS e Android 

- ✅ Performance nativa com componentes nativos 

- ✅ Ecossistema maduro e vasta comunidade 

- ✅ Hot reload para desenvolvimento ágil 

- ✅ Suporte a TypeScript para type safety 

- ✅ Integração fácil com serviços nativos (notificações, armazenamento) 

Tech Stack Frontend Mobile: 

•

# 8{"core": {"framework": "React Native 0.73+", "language": "TypeScript 5.0+", "navigation": "React Navigation 6.x", "state_management": "Zustand / Redux Toolkit", "styling": "Styled Components / NativeWind (Tailwind)" }, "ui_components": {"base": "React Native Paper / NativeBase", "icons": "React Native Vector Icons", "animations": "React Native Reanimated 3.x", "gestures": "React Native Gesture Handler" }, "features": {"pdf_viewer": "react-native-pdf", "video_player": "react-native-video / Expo AV", "notifications": "React Native Firebase / Expo Notifications", "secure_storage": "react-native-keychain", "networking": "Axios / TanStack Query (React Query)", "offline_sync": "WatermelonDB / Realm" }, "development": {"testing": "Jest + React Native Testing Library", "e2e": "Detox / Maestro", "linting": "ESLint + Prettier", "code_quality": "Husky + Lint-staged" }}

Estrutura de Componentes: 

# 9src/ ├── components/ │ ├── common/ │ │ ├── Button/ │ │ ├── Input/ │ │ ├── Card/ │ │ └── Modal/ │ ├── product/ │ │ ├── ProductCard/ │ │ ├── ProductGrid/ │ │ ├── ProductCarousel/ │ │ └── LockedProductCard/ │ ├── content/ │ │ ├── PDFViewer/ │ │ ├── VideoPlayer/ │ │ ├── AudioPlayer/ │ │ └── TextContent/ │ └── navigation/ │ ├── AppNavigator/ │ ├── TabBar/ │ └── DrawerMenu/ ├── screens/ │ ├── auth/ │ │ ├── LoginScreen.tsx │ │ ├── SignupScreen.tsx │ │ └── ForgotPasswordScreen.tsx │ ├── home/ │ │ ├── HomeScreen.tsx │ │ └── ProductDetailScreen.tsx │ ├── content/ │ │ ├── ModuleListScreen.tsx │ │ └── ContentViewScreen.tsx │ └── profile/ │ ├── ProfileScreen.tsx │ └── ProgressScreen.tsx ├── store/ │ ├── slices/ │ │ ├── authSlice.ts │ │ ├── productsSlice.ts │ │ ├── contentSlice.ts │ │ └── progressSlice.ts │ └── index.ts ├── services/ │ ├── api/ │ │ ├── authApi.ts │ │ ├── productsApi.ts │ │ └── contentApi.ts │ ├── storage/ │ │ └── SecureStorage.ts │ └── notifications/ │ └── PushNotifications.ts ├── hooks/ │ ├── useAuth.ts │ ├── useProducts.ts │ └── useOfflineSync.ts ├── utils/ │ ├── constants.ts │ ├── helpers.ts │ └── validators.ts └── types/ ├── auth.types.ts 

# 10 ├── product.types.ts └── api.types.ts 

## 2.1.2 Frontend - Painel Administrativo Web 

Recomendação: Next.js 14+ com TypeScript Justificativa: 

- ✅ SSR/SSG para melhor performance e SEO 

- ✅ React Server Components para otimização 

- ✅ App Router para organização moderna 

- ✅ API Routes integradas 

- ✅ TypeScript nativo 

- ✅ Otimizações automáticas de imagens e fontes 

Tech Stack Frontend Web: 

{"core": {"framework": "Next.js 14+ (App Router)", "language": "TypeScript 5.0+", "styling": "Tailwind CSS 3.x + shadcn/ui", "state_management": "Zustand / Jotai" }, "ui_framework": {"components": "shadcn/ui (Radix UI primitives)", "icons": "Lucide React / Heroicons", "forms": "React Hook Form + Zod", "tables": "TanStack Table", "charts": "Recharts / Tremor", "drag_drop": "dnd-kit", "rich_text": "Tiptap / Lexical" }, "data_fetching": {"client": "TanStack Query (React Query)", "server": "Next.js Server Actions", "realtime": "Socket.io client / Pusher" }, "media_handling": {"upload": "Uploadthing / react-dropzone", "image_editor": "react-image-crop", "color_picker": "react-colorful" }, "development": {"testing": "Vitest + Testing Library", "e2e": "Playwright", "storybook": "Storybook 7.x", "linting": "ESLint + Prettier" }}

Estrutura de Páginas (App Router): 

# 11 app/ ├── (auth)/ │ ├── login/ │ │ └── page.tsx │ ├── register/ │ │ └── page.tsx │ └── layout.tsx ├── (dashboard)/ │ ├── apps/ │ │ ├── page.tsx │ │ ├── [id]/ │ │ │ ├── page.tsx │ │ │ ├── edit/ │ │ │ │ └── page.tsx │ │ │ └── preview/ │ │ │ └── page.tsx │ │ └── new /│ │ └── page.tsx │ ├── products/ │ │ ├── page.tsx │ │ ├── [id]/ │ │ │ ├── page.tsx │ │ │ └── modules/ │ │ │ └── page.tsx │ │ └── new /│ │ └── page.tsx │ ├── sales/ │ │ └── page.tsx │ ├── integrations/ │ │ └── page.tsx │ ├── clients/ │ │ └── page.tsx │ ├── analytics/ │ │ └── page.tsx │ └── layout.tsx ├── api/ │ ├── apps/ │ │ └── route.ts │ ├── products/ │ │ └── route.ts │ ├── webhooks/ │ │ ├── hotmart/ │ │ │ └── route.ts │ │ └── kiwify/ │ │ └── route.ts │ └── upload/ │ └── route.ts └── layout.tsx components/ ├── dashboard/ │ ├── AppCard.tsx │ ├── AppEditor/ │ │ ├── LoginScreenEditor.tsx │ │ ├── HomeScreenEditor.tsx │ │ └── GeneralDataEditor.tsx │ ├── ProductForm.tsx │ ├── ModuleForm.tsx │ └── PreviewFrame.tsx ├── ui/ (shadcn/ui components) │ ├── button.tsx │ ├── input .tsx 

# 12 │ ├── card.tsx │ ├── dialog.tsx │ ├── dropdown-menu.tsx │ └── ... └── shared/ ├── Header.tsx ├── Sidebar.tsx └── FileUploader.tsx lib/ ├── api/ │ ├── client.ts │ └── endpoints.ts ├── hooks/ │ ├── useApp.ts │ ├── useProducts.ts │ └── useUpload.ts ├── utils/ │ ├── validation.ts │ └── formatting.ts └── types/ ├── app.types.ts └── product.types.ts 

## 2.1.3 Backend - API e Serviços 

Recomendação: FastAPI com Python 3.11+ Justificativa: 

- ✅ Performance excelente (comparable ao Node.js) 

- ✅ Type hints nativos (validação automática) 

- ✅ Documentação automática (Swagger/OpenAPI) 

- ✅ Async/await nativo para operações I/O 

- ✅ Ecossistema rico para processamento de mídia 

- ✅ Fácil integração com ML/AI (futuras features) 

- ✅ Pydantic para validação robusta de dados 

Tech Stack Backend: 

# 13 {"core": {"framework": "FastAPI 0.104+", "language": "Python 3.11+", "async_runtime": "uvicorn + gunicorn", "validation": "Pydantic 2.x" }, "database": {"orm": "SQLAlchemy 2.x (async)", "migrations": "Alembic", "cache": "Redis 7.x", "search": "Elasticsearch / Meilisearch (opcional)" }, "authentication": {"jwt": "python-jose[cryptography]", "oauth": "authlib", "password_hashing": "passlib[bcrypt]" }, "file_storage": {"s3": "boto3 / aioboto3", "cdn": "CloudFront / Cloudflare" }, "background_tasks": {"queue": "Celery 5.x", "broker": "Redis / RabbitMQ", "scheduler": "Celery Beat" }, "integrations": {"http_client": "httpx (async)", "email": "fastapi-mail", "notifications": "firebase-admin (FCM)", "webhooks": "svix / custom implementation" }, "monitoring": {"logging": "structlog / loguru", "metrics": "Prometheus", "tracing": "OpenTelemetry", "apm": "Sentry" }, "testing": {"framework": "pytest + pytest-asyncio", "coverage": "pytest-cov", "factories": "factory-boy", "mocking": "pytest-mock" }}

Estrutura do Backend: 

# 14 backend/ ├── app/ │ ├── main.py │ ├── config.py │ ├── dependencies.py │ ├── api/ │ │ ├── v1/ │ │ │ ├── __init__.py │ │ │ ├── endpoints/ │ │ │ │ ├── auth.py │ │ │ │ ├── apps.py │ │ │ │ ├── products.py │ │ │ │ ├── modules.py │ │ │ │ ├── content.py │ │ │ │ ├── users.py │ │ │ │ ├── sales.py │ │ │ │ └── webhooks.py │ │ │ └── router.py │ │ └── deps.py │ ├── core/ │ │ ├── security.py │ │ ├── config.py │ │ └── middleware.py │ ├── models/ │ │ ├── user.py │ │ ├── app.py │ │ ├── product.py │ │ ├── module.py │ │ ├── content.py │ │ ├── purchase.py │ │ └── base.py │ ├── schemas/ │ │ ├── user.py │ │ ├── app.py │ │ ├── product.py │ │ ├── module.py │ │ └── content.py │ ├── services/ │ │ ├── auth_service.py │ │ ├── app_service.py │ │ ├── product_service.py │ │ ├── content_service.py │ │ ├── storage_service.py │ │ ├── email_service.py │ │ ├── notification_service.py │ │ └── integration_service.py │ ├── repositories/ │ │ ├── user_repository.py │ │ ├── app_repository.py │ │ ├── product_repository.py │ │ └── content_repository.py │ ├── integrations/ │ │ ├── hotmart.py │ │ ├── kiwify.py │ │ ├── monetizze.py │ │ ├── braip.py │ │ └── base_integration.py │ ├── tasks/ │ │ ├── celery_app.py │ │ ├── content_processing.py │ │ ├── notification_tasks.py │ │ └── scheduled_tasks.py 

# 15 │ ├── utils/ │ │ ├── validators.py │ │ ├── formatters.py │ │ └── helpers.py │ └── db/ │ ├── session.py │ └── base.py ├── alembic/ │ ├── versions/ │ └── env.py ├── tests/ │ ├── conftest.py │ ├── unit/ │ ├── integration/ │ └── e2e/ ├── scripts/ │ ├── init_db.py │ └── seed_data.py ├── requirements/ │ ├── base.txt │ ├── dev.txt │ └── prod.txt ├── .env.example ├── docker-compose.yml ├── Dockerfile └── pyproject.toml 

Exemplo de Estrutura de Endpoint (FastAPI): 

# 16 # app/api/v1/endpoints/apps.py 

from fastapi import APIRouter, Depends, HTTPException, status 

from sqlalchemy.ext.asyncio import AsyncSession 

from typing import List 

from app.api.deps import get_current_user, get_db 

from app.models.user import User 

from app.schemas.app import AppCreate, AppUpdate, AppResponse 

from app.services.app_service import AppService router = APIRouter() @router.post("/", response_model=AppResponse, status_code=status.HTTP_201_CREATED) 

async def create_app( app_data: AppCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Cria um novo aplicativo para o usuário atual. - **name**: Nome do aplicativo - **language**: Código de idioma (pt, en, es, etc.) - **description**: Descrição do app - **login_config**: Configurações da tela de login - **home_config**: Configurações da tela home """ 

app_service = AppService(db) app = await app_service.create_app(app_data, current_user.id) 

return app @router.get("/", response_model=List[AppResponse]) 

async def list_apps( skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Lista todos os aplicativos do usuário atual. """ 

app_service = AppService(db) apps = await app_service.get_user_apps(current_user.id, skip, limit) 

return apps @router.get("/ {app_id} ", response_model=AppResponse) 

async def get_app( app_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Retorna detalhes de um aplicativo específico. """ 

app_service = AppService(db) app = await app_service.get_app_by_id(app_id, current_user.id) 

if not app: 

raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="App não encontrado" 

# 17 )

return app @router.patch("/ {app_id} ", response_model=AppResponse) 

async def update_app( app_id: int, app_data: AppUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Atualiza um aplicativo existente. """ 

app_service = AppService(db) app = await app_service.update_app(app_id, app_data, current_user.id) 

if not app: 

raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="App não encontrado" )

return app @router.post("/ {app_id} /publish", response_model=AppResponse) 

async def publish_app( app_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Publica um aplicativo, gerando o link de acesso. """ 

app_service = AppService(db) app = await app_service.publish_app(app_id, current_user.id) 

if not app: 

raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="App não encontrado" )

return app @router.delete("/ {app_id} ", status_code=status.HTTP_204_NO_CONTENT) 

async def delete_app( app_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user) ): 

""" Deleta um aplicativo. """ 

app_service = AppService(db) success = await app_service.delete_app(app_id, current_user.id) 

if not success: 

raise HTTPException( status_code=status.HTTP_404_NOT_FOUND, detail="App não encontrado" )

# 18 2.1.4 Banco de Dados - Análise Comparativa 

# SQL vs NoSQL: Análise Específica para Este Projeto 

## Opção 1: PostgreSQL (SQL) - ✅ RECOMENDADO 

Vantagens para este projeto: 

- ✅ Relacionamentos complexos : A estrutura hierárquica (User → Apps → Products → Modules → Content) se beneficia de foreign keys e JOINs - ✅ Transações ACID : Crítico para operações de compra e liberação de conteúdo - ✅ Integridade referencial : Previne inconsistências (ex: não deletar produto com módulos associa‐ dos) - ✅ Consultas complexas : Analytics e relatórios de vendas requerem agregações e JOINs eficientes - ✅ JSONB : Suporte nativo para dados semi-estruturados (configurações customizadas de UI) - ✅ Full-text search : Busca de produtos e conteúdos - ✅ Maturidade : Ecossistema robusto, ferramentas maduras (pgAdmin, Postico) - ✅ Triggers e procedures : Automatizar liberação de conteúdo e notificações 

Desvantagens: 

- ⚠️ Escalabilidade horizontal : Mais complexa que NoSQL (mas mitigável com read replicas) - ⚠️ Schema rígido : Mudanças estruturais requerem migrations (mas Alembic facilita) 

Use cases específicos: 

- Gestão de usuários e autenticação - Estrutura de apps, produtos e módulos - Histórico de compras e transações - Analytics e relatórios - Sistema de permissões e controle de acesso 

## Opção 2: MongoDB (NoSQL) - ❌ NÃO RECOMENDADO COMO PRIMARY 

Vantagens: 

- ✅ Flexibilidade de schema : Fácil adicionar novos campos - ✅ Performance em leitura : Documentos denormalizados reduzem JOINs - ✅ Escalabilidade horizontal : Sharding nativo 

Desvantagens para este projeto: 

- ❌ Relacionamentos complexos : Requer denormalização ou múltiplas queries - ❌ Transações : Suporte mais limitado que PostgreSQL - ❌ Consultas agregadas : Menos expressivo que SQL para analytics - ❌ Integridade : Sem foreign keys, pode gerar inconsistências 

Poderia ser usado como: 

- Cache de dados frequentemente acessados - Armazenamento de logs e eventos - Sistema de notificações (dados temporários) 

# 19 Solução Híbrida Recomendada: 

┌─────────────────────────────────────────────────┐ │ PostgreSQL (Primary Database) ││ - Usuários e autenticação ││ - Apps, produtos, módulos, conteúdo ││ - Compras e transações ││ - Permissões e controle de acesso ││ - Analytics e relatórios │└─────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────┐ │ Redis (Cache Layer) ││ - Cache de sessões (JWT tokens) ││ - Cache de produtos liberados por usuário ││ - Rate limiting ││ - Filas de background jobs (Celery) │└─────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────┐ │ Elasticsearch (Opcional) ││ - Busca full-text de produtos ││ - Logs e monitoramento centralizado │└─────────────────────────────────────────────────┘ 

# 20 Schema PostgreSQL Recomendado: 

# 21 -- Usuários e Autenticação 

CREATE TABLE users (id SERIAL PRIMARY KEY ,email VARCHAR(255) UNIQUE NOT NULL ,hashed_password VARCHAR(255) NOT NULL ,full_name VARCHAR(255), is_active BOOLEAN DEFAULT true ,is_verified BOOLEAN DEFAULT false ,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Aplicativos 

CREATE TABLE apps (id SERIAL PRIMARY KEY ,user_id INTEGER REFERENCES users(id) ON DELETE CASCADE ,name VARCHAR(255) NOT NULL ,slug VARCHAR(255) UNIQUE NOT NULL ,

language VARCHAR(10) DEFAULT 'pt', description TEXT, 

-- Configurações de UI (JSONB para flexibilidade) 

login_config JSONB DEFAULT '{}', home_config JSONB DEFAULT '{}', 

-- URLs e assets 

logo_url VARCHAR(500), access_link VARCHAR(500), custom_domain VARCHAR(255), 

-- Configurações gerais 

support_email VARCHAR(255), support_whatsapp VARCHAR(20), 

-- Status 

is_published BOOLEAN DEFAULT false ,published_at TIMESTAMP ,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Produtos 

CREATE TABLE products (id SERIAL PRIMARY KEY ,app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE ,name VARCHAR(255) NOT NULL ,display_name VARCHAR(255), hide_name BOOLEAN DEFAULT false ,

-- Tipo de oferta 

offer_type VARCHAR(50) CHECK (offer_type IN ('main', 'order_bump', 'upsell', 'down sell', 'bonus')), 

-- Regras de liberação 

release_type VARCHAR(50) CHECK (release_type IN ('immediate', 'date', 'days_after_ purchase')), release_date TIMESTAMP ,release_days INTEGER, 

-- Integração com plataforma de pagamento 

platform VARCHAR(50) CHECK (platform IN ('hotmart', 'kiwify', 'monetizze', 

# 22 'braip')), platform_product_id VARCHAR(255) NOT NULL ,

-- URLs 

sales_page_url VARCHAR(500), 

-- Assets 

liberated_logo_url VARCHAR(500), blocked_logo_url VARCHAR(500), 

-- Ordenação e layout 

display_order INTEGER DEFAULT 0, column_layout VARCHAR(20) DEFAULT 'single', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Módulos de Conteúdo 

CREATE TABLE modules (id SERIAL PRIMARY KEY ,product_id INTEGER REFERENCES products(id) ON DELETE CASCADE ,name VARCHAR(255) NOT NULL ,description TEXT, 

-- Ordenação 

display_order INTEGER DEFAULT 0, 

-- Cover/thumbnail 

cover_url VARCHAR(500), 

-- Regras de liberação 

release_type VARCHAR(50) CHECK (release_type IN ('immediate', 'date', 'days_after_ purchase')), release_date TIMESTAMP ,release_days INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Conteúdo dos Módulos 

CREATE TABLE contents (id SERIAL PRIMARY KEY ,module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE ,

-- Tipo de conteúdo 

content_type VARCHAR(50) CHECK (content_type IN ('pdf', 'doc', 'ppt', 'download', 'audio', 'text', 'html', 'external_link', 'webpage', 'google_drive_pdf', 'vimeo', 'panda', 'vsl', 'youtube' )), 

-- Dados do conteúdo (flexível via JSONB) 

content_data JSONB NOT NULL ,

-- Configurações de exibição 

open_directly BOOLEAN DEFAULT false ,custom_cover_url VARCHAR(500), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

# 23 ); 

-- Compras (sincronizadas via webhook) 

CREATE TABLE purchases (id SERIAL PRIMARY KEY ,user_email VARCHAR(255) NOT NULL ,product_id INTEGER REFERENCES products(id), 

-- Dados da transação 

platform VARCHAR(50), platform_transaction_id VARCHAR(255) UNIQUE NOT NULL ,purchase_date TIMESTAMP NOT NULL ,amount DECIMAL(10, 2), currency VARCHAR(10) DEFAULT 'BRL', 

-- Status 

status VARCHAR(50) CHECK (status IN ('approved', 'pending', 'refunded', 'can‐ celled')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Acesso de usuários aos apps (gerado após compra) 

CREATE TABLE user_app_access (id SERIAL PRIMARY KEY ,user_email VARCHAR(255) NOT NULL ,app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE ,granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,last_accessed_at TIMESTAMP ,

UNIQUE (user_email, app_id) ); 

-- Progresso do usuário 

CREATE TABLE user_progress (id SERIAL PRIMARY KEY ,user_email VARCHAR(255) NOT NULL ,content_id INTEGER REFERENCES contents(id) ON DELETE CASCADE ,completed BOOLEAN DEFAULT false ,completed_at TIMESTAMP ,progress_percentage INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,

UNIQUE (user_email, content_id) ); 

-- Notificações push 

CREATE TABLE push_notifications (id SERIAL PRIMARY KEY ,app_id INTEGER REFERENCES apps(id) ON DELETE CASCADE ,title VARCHAR(255) NOT NULL ,body TEXT NOT NULL ,

-- Segmentação (null = todos os usuários) 

target_users JSONB, 

-- Agendamento 

scheduled_for TIMESTAMP ,

# 24 sent_at TIMESTAMP ,

-- Status 

status VARCHAR(50) CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'fai led')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 

); 

-- Logs de email (recuperação de acesso) 

CREATE TABLE email_logs (id SERIAL PRIMARY KEY ,user_email VARCHAR(255) NOT NULL ,email_type VARCHAR(50) CHECK (email_type IN ('access_recovery', 'new_content', 'we lcome')), sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,status VARCHAR(50) CHECK (status IN ('sent', 'failed')), error_message TEXT ); 

-- Índices para performance 

CREATE INDEX idx_apps_user_id ON apps(user_id); 

CREATE INDEX idx_products_app_id ON products(app_id); 

CREATE INDEX idx_modules_product_id ON modules(product_id); 

CREATE INDEX idx_contents_module_id ON contents(module_id); 

CREATE INDEX idx_purchases_user_email ON purchases(user_email); 

CREATE INDEX idx_purchases_platform_transaction_id ON pur‐ chases(platform_transaction_id); 

CREATE INDEX idx_user_app_access_user_email ON user_app_access(user_email); 

CREATE INDEX idx_user_progress_user_email ON user_progress(user_email); 

## Redis - Casos de Uso: 

# Cache de produtos liberados 

CACHE_KEY = f"user: {user_email }:products" TTL = 3600 # 1 hora # Session storage 

SESSION_KEY = f"session: {token }"TTL = 86400 # 24 horas # Rate limiting 

RATE_LIMIT_KEY = f"rate_limit: {user_id }:{endpoint }"TTL = 60 # 1 minuto # Celery queue (background jobs) 

CELERY_BROKER_URL = "redis://localhost:6379/0" CELERY_RESULT_BACKEND = "redis://localhost:6379/0" 

# 25 2.1.5 Infraestrutura e Deployment 

## Arquitetura de Infraestrutura Recomendada: 

┌────────────────────────────────────────────────────────────┐ │ CLOUDFLARE / CDN ││ - DNS Management ││ - DDoS Protection ││ - Static Assets Caching ││ - Rate Limiting (Layer 7) │└────────────────────────────────────────────────────────────┘ ▼┌────────────────────────────────────────────────────────────┐ │ LOAD BALANCER (AWS ALB) ││ - SSL/TLS Termination ││ - Health Checks ││ - Sticky Sessions │└────────────────────────────────────────────────────────────┘ ▼┌──────────────────┴──────────────────┐ ▼ ▼┌──────────────────┐ ┌──────────────────┐ │ WEB FRONTEND │ │ API BACKEND ││ (Next.js) │◄───────────────►│ (FastAPI) ││ │ │ ││ - Vercel / │ │ - ECS Fargate / ││ AWS Amplify │ │ Cloud Run ││ - Auto-scaling │ │ - Auto-scaling │└──────────────────┘ └──────────────────┘ ▼┌──────────────────┐ │ DATABASES ││ ││ PostgreSQL ││ (RDS / Supabase)│ │ ││ Redis ││ (ElastiCache) │└──────────────────┘ ▼┌─────────────────────────────────────────────────────────────┐ │ STORAGE & SERVICES ││ ││ S3 / R2 Firebase Cloud SendGrid Sentry ││ (Media files) Messaging (FCM) (Emails) (Errors) │└─────────────────────────────────────────────────────────────┘ 

# 26 Opções de Deployment: 

Opção 1: AWS (Full Control) - ✅ RECOMENDADO PARA PRODUÇÃO 

# Componentes AWS: 

Frontend :- AWS Amplify Hosting (Next.js) - CloudFront (CDN) - Route 53 (DNS) 

Backend :- ECS Fargate (Containers FastAPI) - Application Load Balancer - ECR (Container Registry) 

Database :- RDS PostgreSQL (Multi-AZ) - ElastiCache Redis (Cluster Mode) 

Storage :- S3 (Media files) - CloudFront (CDN para assets) 

Background Jobs :- ECS Fargate (Celery workers) - SQS (Message queue alternativo) 

Monitoring :- CloudWatch (Logs & Metrics) - X-Ray (Tracing) 

Security :- WAF (Web Application Firewall) - Secrets Manager - IAM Roles & Policies 

Custo estimado (produção pequena/média): 

- Frontend (Amplify): ~$5-20/mês - Backend (ECS Fargate 2 tasks): ~$50-100/mês - RDS PostgreSQL (db.t3.medium): ~$70/mês - ElastiCache Redis (cache.t3.micro): ~$15/mês - S3 + CloudFront: ~$10-50/mês (depende do tráfego) - Total: ~$150-255/mês 

# 27 Opção 2: Vercel + Railway/Render (Simplicidade) - ✅ BOM PARA MVP/STARTUPS 

Frontend :- Vercel (Next.js) - Deploy automático via Git - Edge Functions - CDN global incluso - ~$20/mês (Pro plan) 

Backend :- Railway / Render - Deploy de containers - Auto-scaling básico - ~$20-50/mês 

Database :- Supabase (PostgreSQL + Redis) - Managed PostgreSQL - Auth integrado - Storage incluso - ~$25/mês (Pro plan) 

Storage :- Cloudflare R2 (S3-compatible) - Sem taxas de egress - ~$5-15/mês 

Total : ~$70-110/mês 

Opção 3: Google Cloud Platform (Alternativa) 

Frontend :- Firebase Hosting - Cloud CDN 

Backend :- Cloud Run (Serverless containers) - Load Balancing 

Database :- Cloud SQL (PostgreSQL) - Memorystore (Redis) 

Storage :- Cloud Storage 

Total estimado : ~$100-200/mês 

## Docker Setup: 

docker-compose.yml (Desenvolvimento): 

# 28 version : '3.8' 

services :

# Backend API 

api :

build :

context : ./backend 

dockerfile : Dockerfile 

ports :- "8000:8000" 

environment :- DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/appsell - REDIS_URL=redis://redis:6379/0 - JWT_SECRET=your-secret-key - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} 

volumes :- ./backend:/app 

depends_on :- db - redis 

command : uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 

# Celery Worker 

worker :

build :

context : ./backend 

dockerfile : Dockerfile 

environment :- DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/appsell - REDIS_URL=redis://redis:6379/0 

volumes :- ./backend:/app 

depends_on :- db - redis 

command : celery -A app.tasks.celery_app worker --loglevel=info 

# Celery Beat (Scheduler) 

beat :

build :

context : ./backend 

dockerfile : Dockerfile 

environment :- DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/appsell - REDIS_URL=redis://redis:6379/0 

volumes :- ./backend:/app 

depends_on :- db - redis 

command : celery -A app.tasks.celery_app beat --loglevel=info 

# PostgreSQL 

db :

image : postgres:15-alpine 

environment :- POSTGRES_USER=postgres - POSTGRES_PASSWORD=postgres - POSTGRES_DB=appsell 

ports :- "5432:5432" 

# 29 volumes :- postgres_data:/var/lib/postgresql/data 

# Redis 

redis :

image : redis:7-alpine 

ports :- "6379:6379" 

volumes :- redis_data:/data 

# Nginx (Reverse Proxy) 

nginx :

image : nginx:alpine 

ports :- "80:80" - "443:443" 

volumes :- ./nginx/nginx.conf:/etc/nginx/nginx.conf - ./nginx/ssl:/etc/nginx/ssl 

depends_on :- api 

volumes :

postgres_data :

redis_data :

Dockerfile (Backend): 

FROM python:3.11-slim 

WORKDIR /app 

# Install system dependencies 

RUN apt-get update && apt-get install -y \

gcc \

postgresql-client \

&& rm -rf /var/lib/apt/lists/* 

# Install Python dependencies 

COPY requirements/prod.txt requirements.txt 

RUN pip install --no-cache-dir -r requirements.txt 

# Copy application code 

COPY . .

# Create non-root user 

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app 

USER appuser 

EXPOSE 8000 

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 

# 30 CI/CD Pipeline (GitHub Actions): 

# 31 # .github/workflows/deploy.yml 

name : Deploy to Production 

on :

push :

branches : [main] 

jobs :

test :

runs-on : ubuntu-latest 

services :

postgres :

image : postgres:15 

env :

POSTGRES_PASSWORD : postgres 

POSTGRES_DB : test_db 

options : >---health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

ports :- 5432:5432 

steps :- uses : actions/checkout@v3 - name : Set up Python 

uses : actions/setup-python@v4 

with :

python-version : '3.11' - name : Install dependencies 

run : |cd backend pip install -r requirements/dev.txt - name : Run tests 

run : |cd backend pytest tests/ --cov=app --cov-report=xml - name : Upload coverage 

uses : codecov/codecov-action@v3 

deploy-backend :

needs : test 

runs-on : ubuntu-latest 

steps :- uses : actions/checkout@v3 - name : Configure AWS credentials 

uses : aws-actions/configure-aws-credentials@v2 

with :

aws-access-key-id : ${{ secrets.AWS_ACCESS_KEY_ID }} 

aws-secret-access-key : ${{ secrets.AWS_SECRET_ACCESS_KEY }} 

aws-region : us-east-1 - name : Login to Amazon ECR 

# 32 id : login-ecr 

uses : aws-actions/amazon-ecr-login@v1 - name : Build and push Docker image 

env :

ECR_REGISTRY : ${{ steps.login-ecr.outputs.registry }} 

ECR_REPOSITORY : appsell-api 

IMAGE_TAG : ${{ github.sha }} 

run : |cd backend docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG - name : Deploy to ECS 

run : |aws ecs update-service \--cluster appsell-cluster \--service appsell-api \--force-new-deployment 

deploy-frontend :

needs : test 

runs-on : ubuntu-latest 

steps :- uses : actions/checkout@v3 - name : Deploy to Vercel 

uses : amondnet/vercel-action@v20 

with :

vercel-token : ${{ secrets.VERCEL_TOKEN }} 

vercel-org-id : ${{ secrets.VERCEL_ORG_ID }} 

vercel-project-id : ${{ secrets.VERCEL_PROJECT_ID }} 

vercel-args : '--prod' 

# 2.1.6 Escalabilidade e Performance 

## Estratégias de Escalabilidade: 

Horizontal Scaling: 

Backend API: - Auto-scaling baseado em CPU (>70%) - Min: 2 instâncias - Max: 10 instâncias - Target: Response time < 200ms Celery Workers: - Auto-scaling baseado em tamanho da fila - Min: 1 worker - Max: 5 workers Database: - Read replicas para queries pesadas - Connection pooling (PgBouncer) 

Caching Strategy: 

# 33 # Cache layers 

L1: Application cache (in -memory, 5min TTL) L2: Redis cache (1hour TTL) L3: CDN cache (static assets, 1 day TTL) 

# Cache invalidation 

- Event-based: Ao atualizar produto, invalidar cache - Time-based: TTL automático - Manual: API endpoint para flush 

Database Optimization: 

-- Índices compostos para queries comuns 

CREATE INDEX idx_user_products ON purchases(user_email, product_id); 

CREATE INDEX idx_app_products_active ON products(app_id, offer_type) WHERE is_active = true ;

-- Particionamento (para escala futura) 

CREATE TABLE purchases_2025_01 PARTITION OF purchases 

FOR VALUES FROM ('2025-01-01') TO ('2025-02-01'); 

-- Materialized views para analytics 

CREATE MATERIALIZED VIEW daily_sales_summary AS SELECT 

DATE(purchase_date) as date, product_id, 

COUNT (*) as total_sales, 

SUM (amount) as total_revenue 

FROM purchases 

WHERE status = 'approved' 

GROUP BY DATE(purchase_date), product_id; 

-- Refresh automático via trigger ou cron 

# 2.2 System Design 

# 2.2.1 Arquitetura do Sistema 

Arquitetura Recomendada: Monolítica Modular com Serviços Desacoplados 

# 34 ┌─────────────────────────────────────────────────────────────────┐ │ PRESENTATION LAYER ││ ┌──────────────────────┐ ┌─────────────────────────┐ ││ │ Admin Web App │ │ Mobile App │ ││ │ (Next .js) │ │ (React Native) │ ││ └──────────────────────┘ └─────────────────────────┘ │└─────────────────────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────────────────────┐ │ API GATEWAY / BFF ││ - Rate limiting ││ - Authentication ││ - Request routing ││ - Response aggregation │└─────────────────────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────────────────────┐ │ APPLICATION LAYER ││ ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐ ││ │ Auth Service │ │ App Service │ │ Product Service │ ││ └───────────────┘ └──────────────┘ └──────────────────┘ ││ ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐ ││ │Content Service│ │ User Service │ │Integration Service│ ││ └───────────────┘ └──────────────┘ └──────────────────┘ ││ ┌────────────────────────────────────────────────────────┐ ││ │ Background Jobs (Celery) │ ││ │ - Content processing │ ││ │ - Email notifications │ ││ │ - Scheduled releases │ ││ └────────────────────────────────────────────────────────┘ │└─────────────────────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────────────────────┐ │ DATA LAYER ││ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ││ │ PostgreSQL │ │ Redis │ │ File Storage │ ││ │ (Primary ) │ │ (Cache) │ │ (S3/R2) │ ││ └──────────────┘ └──────────────┘ └──────────────────┘ │└─────────────────────────────────────────────────────────────────┘ ▼┌─────────────────────────────────────────────────────────────────┐ │ EXTERNAL SERVICES ││ [Hotmart] [Kiwify] [FCM] [SendGrid] [Cloudflare] │└─────────────────────────────────────────────────────────────────┘ 

Justificativa da Escolha: 

✅ Monolítica Modular vs. Microserviços: 

- Início: Monólito bem estruturado (mais simples, menos overhead) - Módulos desacoplados permitem migração futura para microserviços - Shared database simplifica transações - Background jobs desacoplados (já um “microserviço”) 

✅ Quando migrar para Microserviços: 

- Após 10k+ usuários ativos - Quando equipe crescer (>5 devs) - Quando serviços específicos precisarem escalar independentemente 

# 35 2.2.2 Diagramas de Componentes 

## Diagrama de Componentes - Módulo de Criação de App: 

graph TB subgraph "Frontend - Admin Panel" A[AppEditor Component] --> B[LoginScreenEditor] A --> C[HomeScreenEditor] A --> D[GeneralDataEditor] B --> E[ImageUploader] C --> EC --> F[ColorPicker] D --> G[FormValidator] end subgraph "Backend - App Service" H[AppController] --> I[AppService] I --> J[AppRepository] I --> K[ValidationService] I --> L[StorageService] J --> M[(PostgreSQL)] L --> N[(S3 Storage)] end A -->|HTTP POST| HE -->|Upload Image| L

## Diagrama de Componentes - Sistema de Compra e Acesso: 

sequenceDiagram participant P as Plataforma Pagamento participant W as Webhook Handler participant I as Integration Service 

participant PS as Purchase Service 

participant AS as Access Service 

participant N as Notification Service 

participant U as User P->>W: POST /webhooks/purchase W->>I: Validate webhook signature I->>PS: Create purchase record 

PS->> AS : Grant user access 

AS ->>N: Queue notification N->>U: Send email N->>U: Send push notification U->>Mobile: Access granted 

## Diagrama de Componentes - Sistema de Liberação Programada: 

graph LR A[Celery Beat Scheduler] -->|Every hour| B[Check Release Dates Task] B --> C{Query products<br/>ready to release }C -->|Found| D[Content Release Service] D --> E[Update access permissions] D --> F[Queue notifications] F --> G[Send push notification] F --> H[Send email] C -->|None| I[End] 

# 36 2.2.3 Fluxo de Dados 

## Fluxo 1: Criação de App e Produto 

1. Admin acessa painel web └─> Next.js renderiza AppEditor 2. Admin configura tela de login └─> Upload logo → S3 └─> Salva configurações → PostgreSQL (apps.login_config JSONB) 3. Admin configura tela home └─> Upload banner → S3 └─> Salva cores/layout → PostgreSQL (apps.home_config JSONB) 4. Admin cria produto └─> Seleciona app associado └─> Define tipo de oferta (main/upsell/bonus) └─> Insere ID da plataforma (Hotmart/Kiwify) └─> Upload logos (liberado/bloqueado) → S3 └─> Salva → PostgreSQL (products table) 5. Admin adiciona módulos de conteúdo └─> Upload PDF/vídeo → S3 └─> OU insere link externo (YouTube, Vimeo) └─> Define regras de liberação └─> Salva → PostgreSQL (modules + contents tables) 6. Admin publica app └─> Gera slug único └─> Cria link de acesso (https://app.com/apps/{slug}) └─> Atualiza status: published = true 

## Fluxo 2: Compra e Webhook 

1. Cliente compra produto em Hotmart/Kiwify └─> Plataforma processa pagamento 2. Plataforma envia webhook └─> POST /api/webhooks/hotmart └─> Payload: {buyer_email, product_id, transaction_id, status} 3. Backend valida webhook └─> Verifica assinatura HMAC └─> Checa se product_id existe no banco 4. Backend cria registro de compra └─> INSERT INTO purchases (user_email, product_id, ...) 5. Backend concede acesso └─> INSERT INTO user_app_access (user_email, app_id) └─> Cache em Redis: SET user:{email}:products [{product_ids}] 6. Backend envia notificações └─> Celery task → Send email "Seu acesso foi liberado" └─> Celery task → Send push notification (FCM) 

# 37 Fluxo 3: Login e Acesso ao Conteúdo (Mobile App) 

1. Usuário abre app mobile └─> Insere email + senha 2. App envia credenciais └─> POST /api/auth/login └─> Backend valida no PostgreSQL └─> Gera JWT to ken └─> Retorna to ken + refresh_token 3. App armazena to ken └─> SecureStorage (Keychain iOS / Keystore And roid) 4. App busca produtos liberados └─> GET /api/users/me/products └─> Header: Authorization: Bearer {to ken} 5. Backend verifica acesso └─> Extrai user_email do JWT └─> Checa Redis cache: user:{email}:products └─> Se miss, query PostgreSQL: SELECT p.* FROM products pJOIN purchases pur ON p.id = pur.product_id WHERE pur.user_email = '{email}' AND pur.status = 'approved' └─> Cachea resultado em Redis (TTL 1h) 6. Backend retorna list a de produtos └─> Inclui: nome, logo, módulos, cont eúdo liberado └─> Marca produtos bloqueados (upsells) 7. App renderiza home screen └─> Exibe produtos liberados └─> Exibe upsells bloqueados (com link de vendas) 8. Usuário clica em produto └─> App abre tela de módulos 9. Usuário clica em módulo └─> App abre cont eúdo (PDF, vídeo, etc.) └─> Se PDF: react-native-pdf renderiza └─> Se vídeo: react-native-video player 10. Usuário marca como concluído └─> POST /api/progress └─> Backend atualiza user_progress table 

# 38 2.2.4 APIs e Endpoints Necessários 

## Autenticação 

### Registro de usuário admin POST /api/v1/auth/register Content-Type: application/json {"email": "admin@example.com", "password": "SecurePass123!", "full_name": "Admin User" }Response 201: {"id": 1, "email": "admin@example.com", "full_name": "Admin User", "created_at": "2025-10-01T10:00:00Z" }---### Login POST /api/v1/auth/login Content-Type: application/json {"email": "admin@example.com", "password": "SecurePass123!" }Response 200: {"access_token": "eyJhbGciOiJIUzI1NiIs...", "refresh_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer", "expires_in": 3600 }---### Refresh Token POST /api/v1/auth/refresh Content-Type: application/json Authorization: Bearer {refresh_token} Response 200: {"access_token": "eyJhbGciOiJIUzI1NiIs...", "expires_in": 3600 }---### Logout POST /api/v1/auth/logout Authorization: Bearer {access_token} Response 204: No Content 

# 39 40 Apps 

# 41 ### Criar novo app POST /api/v1/apps Authorization: Bearer {access_token} Content-Type: application/json {"name": "Fitness App", "language": "pt", "description": "App de treinos e dieta", "login_config": {"background_url": "https://i.pinimg.com/736x/ 67/83/47/678347409169915ad7724f3eaa9f2983.jpg", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/6/63/Fit‐ ness_logo_watchos.png", "headline": "Bem-vindo ao Fitness App", "button_color": "#FF5722", "text_color": "#FFFFFF" }, "home_config": {"banner_urls": ["https://i.pinimg.com/736x/68/2b/ c9/682bc9cf1642952aac66ad75c7c8c5d7.jpg "display_style": "netflix", "columns": 2, "title_color": "#000000", "gradient_enabled": true }, "support_email": "suporte@fitnessapp.com", "support_whatsapp": "+5511999999999" }Response 201: {"id": 1, "slug": "fitness-app-a1b2c3", "name": "Fitness App", "access_link": "https://app.example.com/apps/fitness-app-a1b2c3", "is_published": false, "created_at": "2025-10-01T10:00:00Z" }---### Listar apps do usuário GET /api/v1/apps?skip=0&limit=10 Authorization: Bearer {access_token} Response 200: {"total": 5, "items": [{"id": 1, "name": "Fitness App", "slug": "fitness-app-a1b2c3", "is_published": true, "created_at": "2025-10-01T10:00:00Z" }, ... ]}---

# 42 ### Obter app específico GET /api/v1/apps/{app_id} Authorization: Bearer {access_token} Response 200: {"id": 1, "slug": "fitness-app-a1b2c3", "name": "Fitness App", "language": "pt", "login_config": {...}, "home_config": {...}, "products_count": 3, "is_published": true }---### Atualizar app PATCH /api/v1/apps/{app_id} Authorization: Bearer {access_token} Content-Type: application/json {"name": "Fitness App Pro", "login_config": {"button_color": "#4CAF50" }}Response 200: {"id": 1, "name": "Fitness App Pro", ... }---### Publicar app POST /api/v1/apps/{app_id}/publish Authorization: Bearer {access_token} Response 200: {"id": 1, "is_published": true, "published_at": "2025-10-01T12:00:00Z", "access_link": "https://app.example.com/apps/fitness-app-a1b2c3" }---### Deletar app DELETE /api/v1/apps/{app_id} Authorization: Bearer {access_token} Response 204: No Content 

# 43 Produtos 

# 44 ### Criar produto POST /api/v1/products Authorization: Bearer {access_token} Content-Type: application/json {"app_id": 1, "name": "Desafio 14 Dias", "display_name": "Desafio Emagreça Já", "hide_name": false, "offer_type": "main", "release_type": "immediate", "platform": "kiwify", "platform_product_id": "ABC123XYZ", "sales_page_url": "https://pay.kiwify.com.br/abc123", "liberated_logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/ Antifa_logo.svg/250px-Antifa_logo.svg.png", "blocked_logo_url": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvX‐ sEgugOcJZQTuZzMo-ker60pSIzOIfBPPIV7Gq_7nmOU9lVqJWZ-qyurLC-Pj3lrPrrh-pemo‐ JC6Ix27Dam2LmNas‐ ddSS21m37_7YV8qbC2MPE8j1gEIcBqcMqSAvhq5WnAJ34OV3IZYoqhivJo0oN3C2A4NWA0csosSV4jFIbqhOop CrXwKPFu96oW6_Yg/s288/tune.png", "display_order": 1}Response 201: {"id": 1, "name": "Desafio 14 Dias", "app_id": 1, "offer_type": "main", "created_at": "2025-10-01T10:30:00Z" }---### Listar produtos de um app GET /api/v1/apps/{app_id}/products Authorization: Bearer {access_token} Response 200: {"total": 3, "items": [{"id": 1, "name": "Desafio 14 Dias", "offer_type": "main", "modules_count": 5}, ... ]}---### Atualizar produto PATCH /api/v1/products/{product_id} Authorization: Bearer {access_token} Content-Type: application/json {

# 45 "display_name": "Desafio Fitness 14 Dias", "sales_page_url": "https://new-url.com" }Response 200: {...} ---### Deletar produto DELETE /api/v1/products/{product_id} Authorization: Bearer {access_token} Response 204: No Content 

# 46 Módulos e Conteúdo 

# 47 ### Criar módulo POST /api/v1/modules Authorization: Bearer {access_token} Content-Type: application/json {"product_id": 1, "name": "Treinos Semana 1", "description": "7 dias de treinos intensos", "cover_url": "https://i.pinimg.com/736x/de/f7/42/def7424cf72c9823fd‐ b34b76823e829d.jpg", "display_order": 1, "release_type": "immediate" }Response 201: {"id": 1, "name": "Treinos Semana 1", "product_id": 1, "created_at": "2025-10-01T11:00:00Z" }---### Adicionar conteúdo ao módulo POST /api/v1/contents Authorization: Bearer {access_token} Content-Type: application/json {"module_id": 1, "content_type": "pdf", "content_data": {"file_url": "https://cdn.example.com/ebook.pdf", "file_name": "Guia de Treinos.pdf", "file_size": 2048576 }, "open_directly": true }Response 201: {"id": 1, "module_id": 1, "content_type": "pdf", "created_at": "2025-10-01T11:15:00Z" }---### Adicionar vídeo do YouTube POST /api/v1/contents Authorization: Bearer {access_token} Content-Type: application/json {"module_id": 1, "content_type": "youtube", "content_data": {"video_id": "dQw4w9WgXcQ", "hide_player": true, 

# 48 "autoplay": false }}Response 201: {...} 

## Upload de Arquivos 

### Upload de imagem/arquivo POST /api/v1/upload Authorization: Bearer {access_token} Content-Type: multipart/form-data file: [binary data] folder: "logos" | "banners" | "content" | "covers" Response 200: {"url": "https://i.ytimg.com/vi/a4HI_Kf7SVg/maxresdefault.jpg", "size": 204800, "mime_type": "image/png" }

# 49 Usuários e Acesso (Mobile App) 

# 50 ### Login do usuário final (mobile) POST /api/v1/users/login Content-Type: application/json {"email": "user@example.com", "password": "UserPass123!", "app_slug": "fitness-app-a1b2c3" }Response 200: {"access_token": "eyJhbGciOiJIUzI1NiIs...", "user": {"email": "user@example.com", "full_name": "User Name" }}---### Obter produtos liberados do usuário GET /api/v1/users/me/products Authorization: Bearer {user_access_token} Response 200: {"purchased_products": [{"id": 1, "name": "Desafio 14 Dias", "display_name": "Desafio Emagreça Já", "logo_url": "https://upload.wikimedia.org/wikipedia/en/8/8f/ JEI_Learning_Center_logo.jpg", "modules": [{"id": 1, "name": "Treinos Semana 1", "cover_url": "https://i.pinimg.com/originals/2a/25/ e6/2a25e6e3f2ab360600bd6e2928f7eb43.png", "is_accessible": true, "contents": [{"id": 1, "content_type": "pdf", "content_data": {...} }]}]}], "locked_products": [{"id": 2, "name": "Consultoria Individual", "offer_type": "upsell", "sales_page_url": "https://pay.kiwify.com.br/xyz789", "logo_url": "https://img.freepik.com/premium-vector/corporate-business-logo-design_996594-104.jpg" }]

# 51 }---### Marcar conteúdo como concluído POST /api/v1/users/me/progress Authorization: Bearer {user_access_token} Content-Type: application/json {"content_id": 1, "completed": true }Response 200: {"content_id": 1, "completed": true, "completed_at": "2025-10-01T15:30:00Z" }---### Obter progresso do usuário GET /api/v1/users/me/progress?product_id=1 Authorization: Bearer {user_access_token} Response 200: {"total_contents": 20, "completed_contents": 5, "progress_percentage": 25, "details": [{"content_id": 1, "completed": true, "completed_at": "2025-10-01T15:30:00Z" }, ... ]}

# 52 Webhooks 

### Webhook Hotmart POST /api/v1/webhooks/hotmart Content-Type: application/json X-Hotmart-Signature: {hmac_signature} {"event": "PURCHASE_COMPLETE", "data": {"product": {"id": "ABC123" }, "buyer": {"email": "buyer@example.com" }, "purchase": {"transaction": "HP12345678", "order_date": "2025-10-01T10:00:00Z", "price": {"value": 197.00, "currency_code": "BRL" }, "status": "approved" }}}Response 200: {"message": "Webhook processed successfully" }---### Webhook Kiwify POST /api/v1/webhooks/kiwify Content-Type: application/json X-Kiwify-Signature: {hmac_signature} {"event_type": "order.paid", "order_id": "KW123456", "product_id": "XYZ789", "customer": {"email": "buyer@example.com" }, "value": 197.00, "created_at": "2025-10-01T10:00:00Z" }Response 200: {"message": "Webhook processed successfully" }

# 53 Notificações 

### Enviar push notification POST /api/v1/notifications/push Authorization: Bearer {access_token} Content-Type: application/json {"app_id": 1, "title": "Novo conteúdo disponível!", "body": "Semana 2 de treinos já está liberada", "target_users": ["user1@example.com", "user2@example.com"], "scheduled_for": "2025-10-02T08:00:00Z" }Response 201: {"id": 1, "status": "scheduled", "scheduled_for": "2025-10-02T08:00:00Z" }---### Listar notificações enviadas GET /api/v1/notifications?app_id=1&skip=0&limit=10 Authorization: Bearer {access_token} Response 200: {"total": 15, "items": [{"id": 1, "title": "Novo conteúdo disponível!", "status": "sent", "sent_at": "2025-10-02T08:00:00Z" }, ... ]}

# 54 Analytics 

### Obter estatísticas de vendas GET /api/v1/analytics/sales?app_id=1&start_date=2025-10-01&end_date=2025-10-31 Authorization: Bearer {access_token} Response 200: {"total_sales": 127, "total_revenue": 25019.00, "currency": "BRL", "by_product": [{"product_id": 1, "product_name": "Desafio 14 Dias", "sales": 85, "revenue": 16745.00 }, {"product_id": 2, "product_name": "Consultoria Individual", "sales": 42, "revenue": 8274.00 }], "daily_breakdown": [{"date": "2025-10-01", "sales": 5, "revenue": 985.00 }, ... ]}---### Obter métricas de engajamento GET /api/v1/analytics/engagement?app_id=1&start_date=2025-10-01&end_date=2025-10-31 Authorization: Bearer {access_token} Response 200: {"active_users": 245, "avg_session_duration_minutes": 12.5, "content_completion_rate": 68.3, "most_accessed_content": [{"content_id": 1, "name": "Treino Dia 1", "views": 230 }, ... ]}

# 55 2.3 Requisitos de Engenharia 

# 2.3.1 Requisitos Funcionais Detalhados 

## RF01 - Gestão de Usuários Admin 

ID Descrição Prioridade 

RF01.1 O sistema DEVE permitir re‐ gistro de novos usuários ad‐ min com email e senha Alta RF01.2 O sistema DEVE validar form‐ ato de email (RFC 5322) Alta RF01.3 A senha DEVE ter mínimo 8 caracteres, incluindo maiús‐ culas, minúsculas e números Alta RF01.4 O sistema DEVE enviar email de confirmação após registro Média RF01.5 O sistema DEVE permitir re‐ cuperação de senha via email Alta RF01.6 O sistema DEVE implementar autenticação via JWT com refresh tokens Alta RF01.7 O sistema DEVE permitir autenticação via OAuth (Google, Facebook) Baixa 

# 56 RF02 - Criação e Gestão de Apps 

ID Descrição Prioridade 

RF02.1 O sistema DEVE permitir criar aplicativos com nome único por usuário Alta RF02.2 O sistema DEVE gerar slug único e URL de acesso automática Alta RF02.3 O sistema DEVE permitir cus‐ tomização da tela de login (background, logo, headline, cores) Alta RF02.4 O sistema DEVE permitir cus‐ tomização da tela home (ban‐ ners, estilo de exibição, cores) Alta RF02.5 O sistema DEVE suportar 7 idiomas (PT, EN, ES, IT, FR, DE, JP) Média RF02.6 O sistema DEVE permitir con‐ figurar email e WhatsApp de suporte Média RF02.7 O sistema DEVE permitir pre‐ view do app antes da pub‐ licação Alta RF02.8 O sistema DEVE permitir pub‐ licar/despublicar apps Alta RF02.9 O sistema DEVE permitir du‐ plicar apps existentes Baixa RF02.10 O sistema DEVE permitir de‐ letar apps (com confirmação) Alta 

# 57 RF03 - Gestão de Produtos 

ID Descrição Prioridade 

RF03.1 O sistema DEVE permitir criar produtos associados a um app específico Alta RF03.2 O sistema DEVE suportar 4 ti‐ pos de oferta: Produto Prin‐ cipal, Order Bump, Upsell/ Downsell, Bônus Alta RF03.3 O sistema DEVE permitir in‐ tegração com Hotmart, Kiwi‐ fy, Monetizze, Braip via ID de produto Alta RF03.4 O sistema DEVE permitir con‐ figurar regras de liberação: Imediata, Data Específica, Dias Após Compra Alta RF03.5 O sistema DEVE permitir up‐ load de logos (liberado e blo‐ queado) Alta RF03.6 O sistema DEVE permitir con‐ figurar URL de página de ven‐ das para produtos bloquea‐ dos Alta RF03.7 O sistema DEVE permitir re‐ ordenar produtos via drag-and-drop Média RF03.8 O sistema DEVE permitir ocul‐ tar nome do produto na exib‐ ição Baixa 

# 58 RF04 - Gestão de Módulos e Conteúdo 

ID Descrição Prioridade 

RF04.1 O sistema DEVE permitir criar módulos dentro de produtos Alta RF04.2 O sistema DEVE suportar múltiplos formatos de con‐ teúdo: PDF, DOC, PPT, Áudio, Vídeo, Texto, HTML, Links Alta RF04.3 O sistema DEVE permitir up‐ load de arquivos até 500MB Alta RF04.4 O sistema DEVE permitir in‐ corporar vídeos de YouTube, Vimeo, Panda Videos, VSL Play Alta RF04.5 O sistema DEVE permitir ocul‐ tar player do YouTube quando incorporado Média RF04.6 O sistema DEVE permitir links para PDFs do Google Drive Média RF04.7 O sistema DEVE permitir con‐ figurar abertura direta ou com capa customizada Média RF04.8 O sistema DEVE permitir up‐ load de imagem de capa para módulos Alta RF04.9 O sistema DEVE permitir re‐ ordenar módulos e conteúdos Alta 

# 59 RF05 - Sistema de Compra e Acesso 

ID Descrição Prioridade 

RF05.1 O sistema DEVE receber web‐ hooks de plataformas de pagamento (Hotmart, Kiwify, etc.) Alta RF05.2 O sistema DEVE validar assinaturas HMAC dos web‐ hooks Alta RF05.3 O sistema DEVE criar registro de compra ao receber web‐ hook de pagamento aprovado Alta RF05.4 O sistema DEVE conceder acesso automático ao app após compra aprovada Alta RF05.5 O sistema DEVE revogar acesso em caso de reembolso Alta RF05.6 O sistema DEVE aplicar re‐ gras de liberação programada de conteúdo Alta RF05.7 O sistema DEVE enviar email de boas-vindas após primeira compra Média RF05.8 O sistema DEVE enviar push notification quando novo con‐ teúdo for liberado Média 

# 60 RF06 - Aplicativo Móvel (Usuário Final) 

# 61 ID Descrição Prioridade 

RF06.1 O app DEVE permitir login com email e senha Alta RF06.2 O app DEVE exibir tela de lo‐ gin customizada conforme configuração do admin Alta RF06.3 O app DEVE exibir tela home com banners rotativos Alta RF06.4 O app DEVE exibir produtos liberados e bloqueados sep‐ aradamente Alta RF06.5 O app DEVE permitir nave‐ gação por módulos e conteú‐ dos Alta RF06.6 O app DEVE renderizar PDFs diretamente no app Alta RF06.7 O app DEVE reproduzir vídeos com player nativo Alta RF06.8 O app DEVE reproduzir áudios com player nativo Alta RF06.9 O app DEVE permitir marcar conteúdos como concluídos Alta RF06.10 O app DEVE exibir progresso do curso/treinamento Alta RF06.11 O app DEVE redirecionar para página de vendas ao clicar em produto bloqueado Alta RF06.12 O app DEVE funcionar offline para conteúdos já baixados Baixa RF06.13 O app DEVE permitir down‐ load de PDFs para leitura off‐ line Média RF06.14 O app DEVE receber e exibir push notifications Média 

# 62 ID Descrição Prioridade 

RF06.15 O app DEVE ter botão de WhatsApp para suporte Média 

## RF07 - Notificações e Comunicação 

ID Descrição Prioridade 

RF07.1 O sistema DEVE permitir en‐ vio de push notifications para todos os usuários de um app Alta RF07.2 O sistema DEVE permitir en‐ vio de push notifications para usuários específicos Média RF07.3 O sistema DEVE permitir agendamento de notificações Média RF07.4 O sistema DEVE enviar email de recuperação de acesso para usuários inativos Baixa RF07.5 O sistema DEVE enviar email quando novo conteúdo for lib‐ erado Média 

# 63 RF08 - Analytics e Relatórios 

ID Descrição Prioridade 

RF08.1 O sistema DEVE exibir total de vendas por período Alta RF08.2 O sistema DEVE exibir receita total por período Alta RF08.3 O sistema DEVE exibir vendas por produto Alta RF08.4 O sistema DEVE exibir número de usuários ativos Média RF08.5 O sistema DEVE exibir taxa de conclusão de conteúdo Média RF08.6 O sistema DEVE exibir con‐ teúdos mais acessados Baixa RF08.7 O sistema DEVE permitir ex‐ portar relatórios em CSV/Ex‐ cel Baixa 

# 64 2.3.2 Requisitos Não-Funcionais 

## RNF01 - Performance 

ID Descrição Métrica Prioridade 

RNF01.1 O tempo de resposta da API DEVE ser < 200ms para 95% das requisições P95 < 200ms Alta RNF01.2 O tempo de carregamento do app mobile DEVE ser < 2s FCP < 2s Alta RNF01.3 O upload de arquivos até 100MB DEVE ser concluído em < 30s com conexão de 10Mbps Upload speed Média RNF01.4 O sistema DEVE suportar 1000 re‐ quisições simultâneas sem de‐ gradação RPS ≥ 1000 Alta RNF01.5 O sistema DEVE cac‐ hear dados fre‐ quentes por 1h (produtos, módulos) Cache hit ratio > 80% Alta RNF01.6 Consultas ao banco DEVE ter tempo < 50ms Query time < 50ms Alta 

# 65 RNF02 - Escalabilidade 

ID Descrição Prioridade 

RNF02.1 O sistema DEVE escalar hori‐ zontalmente adicionando in‐ stâncias de backend Alta RNF02.2 O banco de dados DEVE suportar read replicas para distribuir carga de leitura Alta RNF02.3 O sistema DEVE suportar 100.000 usuários ativos sim‐ ultaneamente Média RNF02.4 O sistema DEVE suportar 1 milhão de usuários cadastra‐ dos Média 

# 66 RNF03 - Segurança 

ID Descrição Prioridade 

RNF03.1 Senhas DEVEM ser criptogra‐ fadas com bcrypt (cost factor ≥ 12) Alta RNF03.2 Tokens JWT DEVEM ter valid‐ ade de 1h e refresh tokens de 7 dias Alta RNF03.3 Comunicação DEVE usar HTTPS/TLS 1.3 Alta RNF03.4 API DEVE implementar rate limiting (100 req/min por IP) Alta RNF03.5 Webhooks DEVEM validar assinaturas HMAC Alta RNF03.6 Uploads DEVEM ser validados por tipo MIME e tamanho Alta RNF03.7 Sistema DEVE implementar CORS restritivo Alta RNF03.8 Credenciais DEVEM ser armazenadas em Secrets Manager Alta RNF03.9 Sistema DEVE implementar proteção contra SQL Injection Alta RNF03.10 Sistema DEVE implementar proteção contra XSS Alta RNF03.11 Logs NÃO DEVEM conter in‐ formações sensíveis (senhas, tokens) Alta 

# 67 RNF04 - Disponibilidade 

ID Descrição Métrica Prioridade 

RNF04.1 Sistema DEVE ter up‐ time de 99.9% (43.8 min downtime/mês) SLA 99.9% Alta RNF04.2 Banco de dados DEVE ter backup diário automático RPO < 24h Alta RNF04.3 Sistema DEVE ter es‐ tratégia de disaster recovery RTO < 4h Média RNF04.4 Health checks DEVEM executar a cada 30s - Alta 

## RNF05 - Usabilidade 

ID Descrição Prioridade 

RNF05.1 Painel admin DEVE ser re‐ sponsivo (mobile, tablet, desktop) Alta RNF05.2 Interface DEVE seguir princí‐ pios WCAG 2.1 nível AA Média RNF05.3 App mobile DEVE funcionar em iOS 14+ e Android 8+ Alta RNF05.4 Mensagens de erro DEVEM ser claras e acionáveis Alta RNF05.5 Sistema DEVE fornecer feed‐ back visual para ações longas (upload, processamento) Alta 

# 68 RNF06 - Manutenibilidade 

ID Descrição Prioridade 

RNF06.1 Código DEVE ter cobertura de testes ≥ 80% Alta RNF06.2 Código DEVE seguir padrões de linting (ESLint, Pylint) Alta RNF06.3 APIs DEVEM ter docu‐ mentação OpenAPI/Swagger automática Alta RNF06.4 Sistema DEVE ter logs estru‐ turados (JSON) centralizados Alta RNF06.5 Commits DEVEM seguir Con‐ ventional Commits Média 

## RNF07 - Compatibilidade 

ID Descrição Prioridade 

RNF07.1 Frontend web DEVE funcionar em Chrome, Firefox, Safari, Edge (últimas 2 versões) Alta RNF07.2 App mobile DEVE funcionar em iOS 14+ Alta RNF07.3 App mobile DEVE funcionar em Android 8+ Alta RNF07.4 APIs DEVEM seguir versiona‐ mento semântico Alta 

# 2.3.3 Casos de Uso Principais 

## UC01: Criar e Publicar App 

Ator: Admin (Criador de Conteúdo) 

Pré-condições: Usuário autenticado 

Fluxo Principal: 

Admin acessa painel e clica em “Criar Novo App” Sistema exibe formulário de criação 1. 2. 

# 69 Admin insere nome do app e seleciona idioma Admin customiza tela de login: - Upload de background - Upload de logo - Define headline e cores Admin customiza tela home: - Upload de banners - Seleciona estilo de exibição (Original/Netflix) - Define cores e gradientes Admin preenche dados gerais (descrição, email de suporte) Admin clica em “Salvar” Sistema gera slug único e URL de acesso Admin visualiza preview do app Admin clica em “Publicar” Sistema ativa o app e disponibiliza link de acesso 

Fluxo Alternativo 4a: Imagem inválida - Sistema exibe erro “Formato de imagem inválido. Use JPG ou PNG” - Retorna ao passo 4 

Pós-condições: App criado e disponível para adicionar produtos 

## UC02: Adicionar Produto e Conteúdo 

Ator: Admin 

Pré-condições: App já criado 

Fluxo Principal: 

Admin acessa app e clica em “Adicionar Produto” Sistema exibe formulário de produto Admin insere nome do produto Admin seleciona tipo de oferta (Produto Principal) Admin define liberação (Imediato) Admin seleciona plataforma (Kiwify) Admin cola ID do produto da plataforma Admin faz upload de logos (liberado/bloqueado) Admin clica em “Salvar Produto” Sistema cria produto e exibe mensagem de sucesso Admin clica em “Adicionar Módulo” Admin insere nome do módulo (“Treinos Semana 1”) Admin faz upload de capa do módulo Admin clica em “Adicionar Conteúdo” Admin seleciona tipo (PDF) Admin faz upload do PDF Admin marca “Abrir conteúdo diretamente” Admin clica em “Salvar” Sistema processa upload e salva conteúdo 3. 4. 5. 6. 7. 8. 9. 10. 11. 1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11. 12. 13. 14. 15. 16. 17. 18. 19. 

# 70 Fluxo Alternativo 16a: Arquivo muito grande - Sistema exibe erro “Arquivo excede 500MB” - Admin deve compactar ou dividir arquivo - Retorna ao passo 16 

Pós-condições: Produto com módulo e conteúdo disponível 

## UC03: Processar Compra via Webhook 

Ator: Sistema de Pagamento (Kiwify/Hotmart) 

Pré-condições: Produto configurado no sistema 

Fluxo Principal: 

Cliente compra produto na plataforma de pagamento Plataforma envia webhook para sistema Sistema valida assinatura HMAC do webhook Sistema extrai dados: email do comprador, ID do produto, valor Sistema busca produto no banco via platform_product_id Sistema cria registro na tabela purchases 

Sistema concede acesso criando registro em user_app_access 

Sistema cacheia produtos liberados do usuário no Redis Sistema enfileira tarefas: - Enviar email de boas-vindas - Enviar push notification “Acesso liberado” Sistema retorna HTTP 200 para a plataforma 

Fluxo Alternativo 3a: Assinatura inválida - Sistema retorna HTTP 401 - Log de erro é criado - Admin é notificado 

Fluxo Alternativo 5a: Produto não encontrado - Sistema retorna HTTP 404 - Log de erro é criado com detalhes 

Pós-condições: Usuário com acesso ao app/produto 

## UC04: Usuário Acessa Conteúdo no App Mobile 

Ator: Usuário Final 

Pré-condições: Usuário comprou produto 

Fluxo Principal: 

Usuário abre app no smartphone Sistema exibe tela de login customizada Usuário insere email e senha Sistema valida credenciais Sistema gera JWT token Sistema busca produtos liberados do usuário 1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 1. 2. 3. 4. 5. 6. 

# 71 Sistema exibe home screen com: - Banners rotativos - Produtos liberados - Upsells bloqueados - Bônus Usuário clica em produto liberado (“Desafio 14 Dias”) Sistema exibe lista de módulos Usuário clica em módulo (“Treinos Semana 1”) Sistema exibe lista de conteúdos Usuário clica em conteúdo (PDF “Guia de Treinos”) Sistema carrega PDF no visualizador nativo Usuário lê conteúdo Usuário clica em “Marcar como Concluído” Sistema atualiza progresso no backend Sistema exibe badge de conclusão 

Fluxo Alternativo 4a: Credenciais inválidas - Sistema exibe “Email ou senha incorretos” - Retorna ao passo 3 

Fluxo Alternativo 12a: Conteúdo é vídeo - Sistema abre player de vídeo - Usuário assiste vídeo - Progresso é salvo automaticamente 

Pós-condições: Usuário consumiu conteúdo e progresso foi atualizado 

## UC05: Enviar Push Notification 

Ator: Admin 

Pré-condições: App publicado com usuários 

Fluxo Principal: 

Admin acessa seção “Notificações” Admin clica em “Enviar Nova Notificação” Sistema exibe formulário Admin insere título: “Novo treino disponível!” Admin insere mensagem: “Semana 2 já está liberada” Admin seleciona app alvo Admin escolhe “Todos os usuários” Admin agenda para “Amanhã 08:00” Admin clica em “Agendar Notificação” Sistema salva notificação com status “scheduled” Celery Beat executa tarefa no horário agendado Sistema busca tokens FCM dos usuários Sistema envia notificação via Firebase Cloud Messaging Sistema atualiza status para “sent” 7. 8. 9. 10. 11. 12. 13. 14. 15. 16. 17. 1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11. 12. 13. 14. 

# 72 Fluxo Alternativo 13a: Alguns tokens inválidos - Sistema marca tokens como inativos - Sistema continua enviando para tokens válidos 

Pós-condições: Usuários recebem notificação no horário agendado 

# 2.4 Comunicação e Resiliência 

# 2.4.1 Padrões de Comunicação Entre Serviços 

## Padrão 1: Comunicação Síncrona (REST API) 

Uso: Operações imediatas que requerem resposta 

Implementação: 

# Cliente (Frontend) → Backend 

import axios from 'axios'; const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, timeout: 30000, // 30s timeout headers: {'Content-Type': 'application/json', }, }); // Interceptor para retry automático api.interceptors.response.use( response => response, 

async error => {const { config } = error; // Não retenta para certos erros 

if (error.response?.status === 401 || error.response?.status === 403) {

return Promise.reject(error); }// Retry até 3 vezes com backoff exponencial config.retryCount = config.retryCount || 0; 

if (config.retryCount < 3) {config.retryCount += 1; const delay = Math.pow(2, config.retryCount) * 1000; 

await new Promise(resolve => setTimeout(resolve, delay)); 

return api(config); }

return Promise.reject(error); }); 

## Padrão 2: Comunicação Assíncrona (Task Queue) 

Uso: Operações demoradas, não-críticas 

Implementação: 

# 73 # Backend → Celery Worker 

from app.tasks.celery_app import celery_app 

from app.services.email_service import EmailService 

from app.services.notification_service import NotificationService @celery_app.task( bind= True ,max_retries=3, default_retry_delay=60 # 1 minuto 

)

def send_welcome_email(self, user_email: str, app_name: str): 

try :email_service = EmailService() email_service.send_welcome_email(user_email, app_name) 

except Exception as exc: 

# Retry com backoff exponencial 

raise self.retry(exc=exc, countdown=2 ** self.request.retries) @celery_app.task(bind= True , max_retries=5) 

def send_push_notification(self, user_tokens: list[str], title: str, body: str): 

try :notification_service = NotificationService() notification_service.send_bulk_push(user_tokens, title, body) 

except Exception as exc: 

if self.request.retries < self.max_retries: 

raise self.retry(exc=exc, countdown=30) 

else :

# Log falha crítica após todas as tentativas 

logger.error(f"Failed to send push notification after {self.max_retries }

retries") 

## Padrão 3: Comunicação via Webhook (Externo → Sistema) 

Uso: Receber eventos de plataformas externas 

Implementação: 

# 74 # Backend recebendo webhook 

from fastapi import APIRouter, Request, HTTPException, status 

from app.integrations.kiwify import KiwifyIntegration 

from app.services.purchase_service import PurchaseService router = APIRouter() @router.post("/webhooks/kiwify") 

async def kiwify_webhook(request: Request): 

# 1. Obter body e headers 

body = await request.body() signature = request.headers.get("X-Kiwify-Signature") 

# 2. Validar assinatura 

kiwify = KiwifyIntegration() 

if not kiwify.validate_signature(body, signature): 

raise HTTPException( status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature" )

# 3. Processar evento 

try :payload = await request.json() 

# Idempotência: verificar se já processamos este evento 

if await purchase_service.is_processed(payload["order_id"]): 

return {"message": "Event already processed"} 

# Processar compra 

purchase_service = PurchaseService() 

await purchase_service.process_purchase_from_webhook(payload) 

return {"message": "Webhook processed successfully"} 

except Exception as e: 

# Log erro mas retorna 200 para evitar retries infinitos 

logger.error(f"Error processing webhook: {str(e) }", exc_info= True )

return {"message": "Error logged, will investigate"} 

# 75 2.4.2 Estratégias de Retry e Fallback 

## Retry com Backoff Exponencial: 

import asyncio from functools import wraps 

def async_retry(max_attempts=3, backoff_factor=2, exceptions=( Exception ,)): 

""" Decorator para retry com backoff exponencial Args: max_attempts: Número máximo de tentativas backoff_factor: Fator de multiplicação do delay exceptions: Tupla de exceções que devem triggar retry """ 

def decorator(func): @wraps(func) 

async def wrapper(*args, **kwargs): attempt = 0

while attempt < max_attempts: 

try :

return await func(*args, **kwargs) 

except exceptions as e: attempt += 1

if attempt >= max_attempts: 

raise 

delay = (backoff_factor ** attempt) logger.warning( f"Attempt {attempt } failed for {func.__name__ }. "f"Retrying in {delay }s. Error: {str(e) }")

await asyncio.sleep(delay) 

return wrapper 

return decorator 

# Uso 

@async_retry(max_attempts=3, backoff_factor=2, exceptions=(httpx.HTTPError,)) 

async def fetch_product_from_platform(product_id: str): 

async with httpx.AsyncClient() as client: response = await client.get(f"https://api.kiwify.com/products/ {product_id }") response.raise_for_status() 

return response.json() 

# 76 Fallback para Serviços Externos: 

class EmailService :

""" Serviço de email com fallback entre provedores """ 

def __init__(self): self.primary_provider = SendGridProvider() self.fallback_provider = AWSsesProvider() 

async def send_email(self, to: str, subject: str, body: str): 

try :

# Tenta provedor principal 

await self.primary_provider.send(to, subject, body) logger.info(f"Email sent via primary provider (SendGrid) to {to }") 

except Exception as e: logger.warning(f"Primary provider failed: {str(e) }. Trying fallback.") 

try :

# Fallback para provedor secundário 

await self.fallback_provider.send(to, subject, body) logger.info(f"Email sent via fallback provider (SES) to {to }") 

except Exception as fallback_error: 

# Se ambos falharem, enfileira para retry posterior 

logger.error(f"Both providers failed. Enqueueing for later.") 

await self.enqueue_for_retry(to, subject, body) 

raise async def enqueue_for_retry(self, to: str, subject: str, body: str): 

from app.tasks.celery_app import send_email_task 

# Tenta novamente em 30 minutos 

send_email_task.apply_async( args=[to, subject, body], countdown=1800 )

# 2.4.3 Circuit Breakers 

Implementação de Circuit Breaker: 

# 77 from enum import Enum 

from datetime import datetime, timedelta 

import asyncio class CircuitState (Enum): CLOSED = "closed" # Tudo funcionando 

OPEN = "open" # Muitas falhas, bloqueando requisições 

HALF_OPEN = "half_open" # Testando se recuperou 

class CircuitBreaker :

""" Circuit Breaker para proteger serviços externos """ 

def __init__( self, failure_threshold: int = 5, timeout: int = 60, recovery_timeout: int = 30 ): self.failure_threshold = failure_threshold self.timeout = timeout self.recovery_timeout = recovery_timeout self.failure_count = 0self.last_failure_time = None 

self.state = CircuitState.CLOSED 

async def call(self, func, *args, **kwargs): 

if self.state == CircuitState.OPEN: 

if self._should_attempt_reset(): self.state = CircuitState.HALF_OPEN 

else :

raise CircuitBreakerOpenError( f"Circuit breaker is OPEN. Service unavailable." )

try :result = await func(*args, **kwargs) self._on_success() 

return result 

except Exception as e: self._on_failure() 

raise def _should_attempt_reset(self) -> bool: 

if self.last_failure_time is None :

return True return datetime.now() - self.last_failure_time > timedelta(seconds=self.recov‐ ery_timeout) 

def _on_success(self): self.failure_count = 0self.state = CircuitState.CLOSED 

def _on_failure(self): self.failure_count += 1self.last_failure_time = datetime.now() 

if self.failure_count >= self.failure_threshold: self.state = CircuitState.OPEN logger.error(f"Circuit breaker opened after {self.failure_count } fail‐ ures") 

# 78 class CircuitBreakerOpenError (Exception ): 

pass 

# Uso 

hotmart_circuit = CircuitBreaker(failure_threshold=5, recovery_timeout=60) 

async def verify_purchase_with_hotmart(transaction_id: str): 

return await hotmart_circuit.call( _call_hotmart_api, transaction_id )

async def _call_hotmart_api(transaction_id: str): 

async with httpx.AsyncClient() as client: response = await client.get( f"https://api.hotmart.com/transactions/ {transaction_id }")response.raise_for_status() 

return response.json() 

# 2.4.4 Rate Limiting 

Implementação de Rate Limiter: 

# 79 from fastapi import Request, HTTPException, status 

from redis import asyncio as aioredis 

import time class RateLimiter :

""" Rate limiter usando Redis (Token Bucket Algorithm) """ 

def __init__(self, redis_client: aioredis.Redis): self.redis = redis_client 

async def is_allowed( self, identifier: str, max_requests: int = 100, window_seconds: int = 60 ) -> bool: 

""" Verifica se requisição é permitida Args: identifier: IP ou user_id max_requests: Máximo de requisições no período window_seconds: Janela de tempo em segundos """ 

key = f"rate_limit: {identifier }"current_time = int(time.time()) window_start = current_time - window_seconds 

# Remove requisições antigas da janela 

await self.redis.zremrangebyscore(key, 0, window_start) 

# Conta requisições na janela atual 

request_count = await self.redis.zcard(key) 

if request_count >= max_requests: 

return False 

# Adiciona requisição atual 

await self.redis.zadd(key, {str(current_time): current_time}) 

await self.redis.expire(key, window_seconds) 

return True 

# Middleware FastAPI 

from fastapi import Depends 

from app.core.dependencies import get_redis 

async def rate_limit_middleware( request: Request, redis: aioredis.Redis = Depends(get_redis) ): 

# Identifica usuário (IP ou user_id se autenticado) 

identifier = request.client.host 

if hasattr(request.state, "user"): identifier = f"user_ {request.state.user.id }"rate_limiter = RateLimiter(redis) 

# API pública: 100 req/min # API autenticada: 1000 req/min 

# 80 max_requests = 1000 if hasattr(request.state, "user") else 100 

if not await rate_limiter.is_allowed(identifier, max_requests=max_requests): 

raise HTTPException( status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded. Try again later." )

# Aplicar no app 

from fastapi import FastAPI app = FastAPI() app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware) 

# 2.4.5 Estratégias de Caching 

Níveis de Cache: 

# 81 from functools import wraps 

import hashlib import json import pickle from typing import Optional 

class CacheManager :

""" Gerenciador de cache multi-layer """ 

def __init__(self, redis_client: aioredis.Redis): self.redis = redis_client self.memory_cache = {} # L1: In-memory cache 

def cache_key(self, prefix: str, *args, **kwargs) -> str: 

"""Gera chave de cache determinística""" 

data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys= True )hash_obj = hashlib.md5(data.encode()) 

return f" {prefix }:{hash_obj.hexdigest() }"

async def get(self, key: str) -> Optional[any]: 

"""Busca em L1 (memory) → L2 (Redis)""" # L1: Memory cache 

if key in self.memory_cache: value, expiry = self.memory_cache[key] 

if time.time() < expiry: 

return value 

else :

del self.memory_cache[key] 

# L2: Redis cache 

value = await self.redis.get(key) 

if value: deserialized = pickle.loads(value) 

# Popula L1 

self.memory_cache[key] = (deserialized, time.time() + 300) # 5 min 

return deserialized 

return None async def set(self, key: str, value: any, ttl: int = 3600): 

"""Salva em L1 e L2""" # L1: Memory cache 

self.memory_cache[key] = (value, time.time() + min(ttl, 300)) 

# L2: Redis cache 

serialized = pickle.dumps(value) 

await self.redis.setex(key, ttl, serialized) 

async def invalidate(self, pattern: str): 

"""Invalida caches que correspondem ao padrão""" # Invalida L1 

keys_to_delete = [k for k in self.memory_cache.keys() if pattern in k] 

for k in keys_to_delete: 

del self.memory_cache[k] 

# Invalida L2 

keys = await self.redis.keys(pattern) 

if keys: 

await self.redis.delete(*keys) 

# 82 def cached(prefix: str, ttl: int = 3600): 

"""Decorator para cachear resultados de funções""" 

def decorator(func): @wraps(func) 

async def wrapper(*args, **kwargs): cache_manager = kwargs.get('cache_manager') 

if not cache_manager: 

return await func(*args, **kwargs) key = cache_manager.cache_key(prefix, *args, **kwargs) 

# Tenta buscar do cache 

cached_value = await cache_manager.get(key) 

if cached_value is not None :logger.debug(f"Cache hit for {key }") 

return cached_value 

# Se miss, executa função 

result = await func(*args, **kwargs) 

# Salva no cache 

await cache_manager.set(key, result, ttl) logger.debug(f"Cache miss for {key }, value stored") 

return result 

return wrapper 

return decorator 

# Uso 

@cached(prefix="user_products", ttl=3600) 

async def get_user_products(user_email: str, cache_manager: CacheManager): 

# Query pesada no banco 

products = await db.execute( select(Product).join(Purchase).where(Purchase.user_email == user_email) )

return products 

# Invalidação ao atualizar produto 

async def update_product(product_id: int, data: dict): 

# Atualiza produto 

await db.execute(update(Product).where(Product.id == product_id).values(**data)) 

# Invalida cache relacionado 

await cache_manager.invalidate(f"user_products:*") 

await cache_manager.invalidate(f"product: {product_id }:*") 

# 2.4.6 Tratamento de Erros e Logging 

Logging Estruturado: 

# 83 import structlog from fastapi import Request 

import sys 

# Configuração do structlog 

structlog.configure( processors=[ structlog.stdlib.filter_by_level, structlog.stdlib.add_logger_name, structlog.stdlib.add_log_level, structlog.stdlib.PositionalArgumentsFormatter(), structlog.processors.TimeStamper(fmt="iso"), structlog.processors.StackInfoRenderer(), structlog.processors.format_exc_info, structlog.processors.UnicodeDecoder(), structlog.processors.JSONRenderer() ], wrapper_class=structlog.stdlib.BoundLogger, logger_factory=structlog.stdlib.LoggerFactory(), cache_logger_on_first_use= True ,)logger = structlog.get_logger() 

# Middleware de logging 

async def logging_middleware(request: Request, call_next): request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())) 

# Bind contexto à requisição 

log = logger.bind( request_id=request_id, method=request.method, path=request.url.path, client_ip=request.client.host )

try :response = await call_next(request) log.info( "request_completed", status_code=response.status_code, duration_ms=(time.time() - request.state.start_time) * 1000 )response.headers["X-Request-ID"] = request_id 

return response 

except Exception as exc: log.error( "request_failed", error=str(exc), exc_info=sys.exc_info() )

raise 

# Exception handlers customizados 

from fastapi.exceptions import RequestValidationError 

from pydantic import ValidationError @app.exception_handler(RequestValidationError) 

async def validation_exception_handler(request: Request, exc: RequestValidationError): 

# 84 logger.warning( "validation_error", path=request.url.path, errors=exc.errors() )

return JSONResponse( status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={ "error": "Validation Error", "details": exc.errors() })@app.exception_handler( Exception )

async def global_exception_handler(request: Request, exc: Exception ): logger.error( "unhandled_exception", path=request.url.path, error=str(exc), exc_info=sys.exc_info() )

return JSONResponse( status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={ "error": "Internal Server Error", "message": "An unexpected error occurred. Please try again later." })

# 2.4.7 Monitoramento e Observabilidade 

Health Checks: 

# 85 from fastapi import APIRouter, status 

from sqlalchemy import text router = APIRouter() @router.get("/health") 

async def health_check(): 

"""Health check básico""" 

return {"status": "healthy"} @router.get("/health/detailed") 

async def detailed_health_check(db: AsyncSession = Depends(get_db)): 

"""Health check detalhado com verificação de dependências""" 

health_status = {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "checks": {} }

# Check database 

try :

await db.execute(text("SELECT 1")) health_status["checks"]["database"] = {"status": "up"} 

except Exception as e: health_status["status"] = "unhealthy" health_status["checks"]["database"] = {"status": "down", "error": str(e) }

# Check Redis 

try :

await redis_client.ping() health_status["checks"]["redis"] = {"status": "up"} 

except Exception as e: health_status["status"] = "degraded" health_status["checks"]["redis"] = {"status": "down", "error": str(e) }

# Check S3 

try :s3_client.head_bucket(Bucket=settings.S3_BUCKET) health_status["checks"]["s3"] = {"status": "up"} 

except Exception as e: health_status["status"] = "degraded" health_status["checks"]["s3"] = {"status": "down", "error": str(e) }status_code = status.HTTP_200_OK if health_status["status"] == "healthy" else 

status.HTTP_503_SERVICE_UNAVAILABLE 

return JSONResponse(content=health_status, status_code=status_code) 

Métricas (Prometheus): 

# 86 from prometheus_client import Counter, Histogram, Gauge 

import time 

# Métricas personalizadas 

request_count = Counter( 'api_requests_total', 'Total de requisições', ['method', 'endpoint', 'status'] )request_duration = Histogram( 'api_request_duration_seconds', 'Duração das requisições', ['method', 'endpoint'] )active_users = Gauge( 'active_users_total', 'Número de usuários ativos' )

# Middleware de métricas 

async def metrics_middleware(request: Request, call_next): start_time = time.time() response = await call_next(request) duration = time.time() - start_time request_count.labels( method=request.method, endpoint=request.url.path, status=response.status_code ).inc() request_duration.labels( method=request.method, endpoint=request.url.path ).observe(duration) 

return response 

# Endpoint de métricas 

from prometheus_client import generate_latest @app.get("/metrics") 

async def metrics(): 

return Response(content=generate_latest(), media_type="text/plain") 

# 87 2.5 Estrutura do Projeto 

# 2.5.1 Organização de Pastas - Backend 

# 88 appsell-platform/ ├── backend/ │ ├── app/ │ │ ├── __init__.py │ │ ├── main.py # Ponto de entrada FastAPI 

│ │ ├── config.py # Configurações (Pydantic Settings) 

│ │ ││ │ ├── api/ # Camada de API 

│ │ │ ├── __init__.py │ │ │ ├── deps.py # Dependências compartilhadas 

│ │ │ └── v1/ # Versão 1 da API 

│ │ │ ├── __init__.py │ │ │ ├── router.py # Router principal v1 

│ │ │ └── endpoints/ # Endpoints organizados por domínio 

│ │ │ ├── __init__.py │ │ │ ├── auth.py # Autenticação 

│ │ │ ├── apps.py # CRUD de apps 

│ │ │ ├── products.py # CRUD de produtos 

│ │ │ ├── modules.py # CRUD de módulos 

│ │ │ ├── contents.py # CRUD de conteúdos 

│ │ │ ├── users.py # Usuários finais 

│ │ │ ├── uploads.py # Upload de arquivos 

│ │ │ ├── webhooks.py # Webhooks externos 

│ │ │ ├── notifications.py # Push notifications 

│ │ │ └── analytics.py # Analytics e relatórios 

│ │ ││ │ ├── core/ # Núcleo da aplicação 

│ │ │ ├── __init__.py │ │ │ ├── config.py # Configurações centralizadas 

│ │ │ ├── security.py # JWT, hashing, etc. 

│ │ │ └── middleware.py # Middlewares customizados 

│ │ ││ │ ├── models/ # Modelos SQLAlchemy 

│ │ │ ├── __init__.py │ │ │ ├── base.py # Base model com campos comuns 

│ │ │ ├── user.py # Modelo de usuário admin 

│ │ │ ├── app.py # Modelo de aplicativo 

│ │ │ ├── product.py # Modelo de produto 

│ │ │ ├── module.py # Modelo de módulo 

│ │ │ ├── content.py # Modelo de conteúdo 

│ │ │ ├── purchase.py # Modelo de compra 

│ │ │ ├── user_app_access.py # Modelo de acesso 

│ │ │ ├── user_progress.py # Modelo de progresso 

│ │ │ └── notification.py # Modelo de notificação 

│ │ ││ │ ├── schemas/ # Pydantic schemas (DTOs) 

│ │ │ ├── __init__.py │ │ │ ├── user.py # UserCreate, UserResponse, etc. 

│ │ │ ├── app.py # AppCreate, AppUpdate, AppResponse 

│ │ │ ├── product.py # ProductCreate, ProductResponse 

│ │ │ ├── module.py # ModuleCreate, ModuleResponse 

│ │ │ ├── content.py # ContentCreate, ContentResponse 

│ │ │ ├── auth.py # Login, Token, Register 

│ │ │ └── webhook.py # WebhookPayload schemas 

│ │ ││ │ ├── services/ # Lógica de negócio 

│ │ │ ├── __init__.py │ │ │ ├── auth_service.py # Autenticação e autorização 

│ │ │ ├── app_service.py # Lógica de apps 

│ │ │ ├── product_service.py # Lógica de produtos 

│ │ │ ├── content_service.py # Processamento de conteúdo 

│ │ │ ├── purchase_service.py # Processamento de compras 

# 89 │ │ │ ├── access_service.py # Controle de acesso 

│ │ │ ├── storage_service.py # Upload para S3 

│ │ │ ├── email_service.py # Envio de emails 

│ │ │ ├── notification_service.py # Push notifications 

│ │ │ └── analytics_service.py # Cálculos de analytics 

│ │ ││ │ ├── repositories/ # Camada de dados (Repository Pattern) 

│ │ │ ├── __init__.py │ │ │ ├── base_repository.py # Repository abstrato 

│ │ │ ├── user_repository.py # Operações de BD para users 

│ │ │ ├── app_repository.py # Operações de BD para apps 

│ │ │ ├── product_repository.py # Operações de BD para products 

│ │ │ └── purchase_repository.py # Operações de BD para purchases 

│ │ ││ │ ├── integrations/ # Integrações com APIs externas 

│ │ │ ├── __init__.py │ │ │ ├── base_integration.py # Classe base para integrações 

│ │ │ ├── hotmart.py # Integração Hotmart 

│ │ │ ├── kiwify.py # Integração Kiwify 

│ │ │ ├── monetizze.py # Integração Monetizze 

│ │ │ ├── braip.py # Integração Braip 

│ │ │ ├── firebase.py # Firebase Cloud Messaging 

│ │ │ └── sendgrid.py # SendGrid email 

│ │ ││ │ ├── tasks/ # Celery tasks (background jobs) 

│ │ │ ├── __init__.py │ │ │ ├── celery_app.py # Configuração do Celery 

│ │ │ ├── email_tasks.py # Tasks de email 

│ │ │ ├── notification_tasks.py # Tasks de notificação 

│ │ │ ├── content_tasks.py # Processamento de conteúdo 

│ │ │ └── scheduled_tasks.py # Tasks agendadas (Beat) 

│ │ ││ │ ├── utils/ # Utilitários 

│ │ │ ├── __init__.py │ │ │ ├── validators.py # Validadores customizados 

│ │ │ ├── formatters.py # Formatadores de dados 

│ │ │ ├── helpers.py # Funções auxiliares 

│ │ │ └── constants.py # Constantes da aplicação 

│ │ ││ │ └── db/ # Configuração de banco de dados 

│ │ ├── __init__.py │ │ ├── session.py # Sessão assíncrona do SQLAlchemy 

│ │ └── base.py # Base declarativa 

│ ││ ├── alembic/ # Migrations 

│ │ ├── versions/ # Arquivos de migration 

│ │ ├── env.py # Configuração do Alembic 

│ │ └── script.py.mako # Template de migration 

│ ││ ├── tests/ # Testes 

│ │ ├── __init__.py │ │ ├── conftest.py # Fixtures do pytest 

│ │ ├── unit/ # Testes unitários 

│ │ │ ├── test_services.py │ │ │ └── test_repositories.py │ │ ├── integration/ # Testes de integração 

│ │ │ ├── test_api_endpoints.py │ │ │ └── test_database.py │ │ └── e2e/ # Testes end-to-end 

│ │ └── test_user_flows.py │ ││ ├── scripts/ # Scripts utilitários 

│ │ ├── init_db.py # Inicializar banco 

# 90 │ │ ├── seed_data.py # Popular com dados de teste 

│ │ └── cleanup.py # Limpeza de dados antigos 

│ ││ ├── requirements/ # Dependências Python 

│ │ ├── base.txt # Deps base 

│ │ ├── dev.txt # Deps de desenvolvimento 

│ │ └── prod.txt # Deps de produção 

│ ││ ├── .env.example # Exemplo de variáveis de ambiente 

│ ├── .gitignore │ ├── docker-compose.yml # Docker para desenvolvimento 

│ ├── Dockerfile # Imagem Docker do backend 

│ ├── alembic.ini # Configuração do Alembic 

│ ├── pyproject.toml # Configuração do Poetry 

│ └── README.md │├── frontend-admin/ # Painel administrativo (Next.js) 

│ ├── public/ │ │ ├── favicon.ico │ │ └── images/ │ ││ ├── src/ │ │ ├── app/ # Next.js App Router 

│ │ │ ├── (auth)/ # Grupo de rotas de autenticação 

│ │ │ │ ├── login/ │ │ │ │ │ └── page.tsx │ │ │ │ ├── register/ │ │ │ │ │ └── page.tsx │ │ │ │ └── layout.tsx │ │ │ ││ │ │ ├── (dashboard)/ # Grupo de rotas do dashboard 

│ │ │ │ ├── apps/ │ │ │ │ │ ├── page.tsx # Lista de apps 

│ │ │ │ │ ├── [id]/ │ │ │ │ │ │ ├── page.tsx # Detalhes do app 

│ │ │ │ │ │ └── edit/ │ │ │ │ │ │ └── page.tsx │ │ │ │ │ └── new/ │ │ │ │ │ └── page.tsx │ │ │ │ ├── products/ │ │ │ │ ├── analytics/ │ │ │ │ ├── notifications/ │ │ │ │ └── layout.tsx │ │ │ ││ │ │ ├── api/ # API Routes do Next.js 

│ │ │ │ ├── auth/ │ │ │ │ └── upload/ │ │ │ ││ │ │ ├── layout.tsx # Layout raiz 

│ │ │ └── page.tsx # Home page 

│ │ ││ │ ├── components/ # Componentes React 

│ │ │ ├── ui/ # Componentes shadcn/ui 

│ │ │ │ ├── button.tsx │ │ │ │ ├── input.tsx │ │ │ │ ├── card.tsx │ │ │ │ └── ... │ │ │ ││ │ │ ├── dashboard/ # Componentes específicos 

│ │ │ │ ├── AppCard.tsx │ │ │ │ ├── AppEditor/ │ │ │ │ │ ├── LoginScreenEditor.tsx │ │ │ │ │ ├── HomeScreenEditor.tsx 

# 91 │ │ │ │ │ └── GeneralDataEditor.tsx │ │ │ │ ├── ProductForm.tsx │ │ │ │ └── ModuleForm.tsx │ │ │ ││ │ │ └── shared/ # Componentes compartilhados 

│ │ │ ├── Header.tsx │ │ │ ├── Sidebar.tsx │ │ │ ├── FileUploader.tsx │ │ │ └── ColorPicker.tsx │ │ ││ │ ├── lib/ # Bibliotecas e utilitários 

│ │ │ ├── api/ │ │ │ │ ├── client.ts # Axios client configurado 

│ │ │ │ └── endpoints.ts # Endpoints da API 

│ │ │ ├── hooks/ │ │ │ │ ├── useApp.ts │ │ │ │ ├── useProducts.ts │ │ │ │ └── useAuth.ts │ │ │ ├── utils/ │ │ │ │ ├── validation.ts │ │ │ │ └── formatting.ts │ │ │ └── types/ │ │ │ ├── app.types.ts │ │ │ └── product.types.ts │ │ ││ │ └── styles/ │ │ └── globals.css # Tailwind + estilos globais 

│ ││ ├── .env.local.example │ ├── .gitignore │ ├── next.config.js │ ├── package.json │ ├── tsconfig.json │ ├── tailwind.config.ts │ └── README.md │├── mobile-app/ # App móvel (React Native) 

│ ├── android/ # Configurações Android 

│ ├── ios/ # Configurações iOS 

│ ││ ├── src/ │ │ ├── components/ │ │ │ ├── common/ │ │ │ │ ├── Button/ │ │ │ │ ├── Input/ │ │ │ │ └── Card/ │ │ │ ├── product/ │ │ │ │ ├── ProductCard/ │ │ │ │ ├── ProductGrid/ │ │ │ │ └── LockedProductCard/ │ │ │ └── content/ │ │ │ ├── PDFViewer/ │ │ │ ├── VideoPlayer/ │ │ │ └── AudioPlayer/ │ │ ││ │ ├── screens/ │ │ │ ├── auth/ │ │ │ │ ├── LoginScreen.tsx │ │ │ │ └── SignupScreen.tsx │ │ │ ├── home/ │ │ │ │ ├── HomeScreen.tsx │ │ │ │ └── ProductDetailScreen.tsx │ │ │ └── content/ 

# 92 │ │ │ ├── ModuleListScreen.tsx │ │ │ └── ContentViewScreen.tsx │ │ ││ │ ├── navigation/ │ │ │ └── AppNavigator.tsx │ │ ││ │ ├── store/ # Zustand store 

│ │ │ ├── slices/ │ │ │ │ ├── authSlice.ts │ │ │ │ └── productsSlice.ts │ │ │ └── index.ts │ │ ││ │ ├── services/ │ │ │ ├── api/ │ │ │ │ ├── authApi.ts │ │ │ │ └── productsApi.ts │ │ │ ├── storage/ │ │ │ │ └── SecureStorage.ts │ │ │ └── notifications/ │ │ │ └── PushNotifications.ts │ │ ││ │ ├── hooks/ │ │ │ ├── useAuth.ts │ │ │ └── useProducts.ts │ │ ││ │ ├── utils/ │ │ │ ├── constants.ts │ │ │ └── helpers.ts │ │ ││ │ └── types/ │ │ ├── auth.types.ts │ │ └── product.types.ts │ ││ ├── .env.example │ ├── package.json │ ├── tsconfig.json │ ├── metro.config.js │ ├── babel.config.js │ ├── app.json │ └── README.md │├── docs/ # Documentação 

│ ├── api/ # Docs da API 

│ ├── architecture/ # Diagramas e docs de arquitetura 

│ └── guides/ # Guias de uso 

│├── .github/ # GitHub Actions 

│ └── workflows/ │ ├── backend-ci.yml │ ├── frontend-ci.yml │ └── deploy.yml │├── docker-compose.yml # Compose para ambiente completo 

├── .gitignore └── README.md # README principal do projeto 

# 93 2.5.2 Padrões de Código 

## Python (Backend) 

# 94 """ Padrões de Código Python - PEP 8 + Type Hints Referências: - PEP 8: https://pep8.org/ - PEP 484: Type Hints - Google Python Style Guide """ # 1. IMPORTS # Ordem: stdlib → third-party → local 

from typing import Optional, List 

from datetime import datetime 

from fastapi import APIRouter, Depends, HTTPException 

from sqlalchemy.ext.asyncio import AsyncSession 

from app.models.user import User 

from app.schemas.app import AppCreate, AppResponse 

from app.services.app_service import AppService 

# 2. CONSTANTES # Todas em UPPER_CASE 

MAX_FILE_SIZE_MB = 500 ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'} JWT_ALGORITHM = "HS256" 

# 3. CLASSES # PascalCase, docstrings em formato Google 

class AppService :

""" Serviço responsável pela lógica de negócio de aplicativos. Attributes: db: Sessão assíncrona do banco de dados cache_manager: Gerenciador de cache """ 

def __init__(self, db: AsyncSession, cache_manager: Optional[CacheManager] = None ):

""" Inicializa o serviço de apps. Args: db: Sessão do banco de dados cache_manager: Gerenciador de cache (opcional) """ 

self.db = db self.cache_manager = cache_manager 

async def create_app( self, app_data: AppCreate, user_id: int ) -> AppResponse: 

""" Cria um novo aplicativo para o usuário. Args: app_data: Dados do aplicativo a ser criado user_id: ID do usuário criador 

# 95 Returns: AppResponse: Dados do aplicativo criado Raises: ValueError: Se o nome do app já existe para o usuário DatabaseError: Se houver erro ao salvar no banco """ # Validar unicidade do nome 

existing_app = await self._get_app_by_name(app_data.name, user_id) 

if existing_app: 

raise ValueError (f"App com nome '{app_data.name }' já existe") 

# Gerar slug único 

slug = self._generate_unique_slug(app_data.name) 

# Criar app no banco 

app = App( user_id=user_id, name=app_data.name, slug=slug, language=app_data.language, **app_data.dict(exclude={'name', 'language'}) )self.db.add(app) 

await self.db.commit() 

await self.db.refresh(app) 

return AppResponse.from_orm(app) 

def _generate_unique_slug(self, name: str) -> str: 

""" Gera slug único baseado no nome. Args: name: Nome do app Returns: str: Slug único (ex: "my-app-a1b2c3") """ 

base_slug = name.lower().replace(' ', '-') unique_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6)) 

return f" {base_slug }-{unique_suffix }"

# 4. FUNÇÕES # snake_case, type hints obrigatórios 

async def validate_webhook_signature( body: bytes, signature: str, secret: str ) -> bool: 

""" Valida assinatura HMAC de webhook. Args: body: Corpo da requisição em bytes signature: Assinatura recebida no header secret: Secret key para validação Returns: bool: True se assinatura é válida """ 

# 96 expected_signature = hmac.new( secret.encode(), body, hashlib.sha256 ).hexdigest() 

return hmac.compare_digest(signature, expected_signature) 

# 5. TRATAMENTO DE ERROS # Exceções customizadas com mensagens claras 

class AppNotFoundError (Exception ): 

"""Exceção lançada quando app não é encontrado.""" 

def __init__(self, app_id: int): self.app_id = app_id super().__init__(f"App with ID {app_id } not found") 

# 6. LOGGING # Usar structlog, não print() 

logger = structlog.get_logger() 

async def some_function(): logger.info("function_started", param1="value1") 

try :

# código 

logger.debug("processing_data", count=len(data)) 

except Exception as e: logger.error("function_failed", error=str(e), exc_info= True )

raise 

# 7. DOCSTRINGS # Formato Google, obrigatório para funções públicas 

def calculate_progress(completed: int, total: int) -> float: 

""" Calcula porcentagem de progresso. Args: completed: Número de itens concluídos total: Total de itens Returns: float: Porcentagem de progresso (0-100) Raises: ValueError: Se total <= 0Examples: >>> calculate_progress(5, 10) 50.0 """ 

if total <= 0: 

raise ValueError ("Total must be greater than 0") 

return (completed / total) * 100 

# 97 TypeScript/React (Frontend) 

# 98 /** * Padrões de Código TypeScript/React ** Referências: * - Airbnb JavaScript Style Guide * - React TypeScript Cheatsheet * - Next.js Best Practices */ // 1. IMPORTS // Ordem: React → bibliotecas → componentes locais → types → estilos 

import { useState, useEffect, useCallback } from 'react'; 

import { useRouter } from 'next/navigation'; 

import { toast } from 'sonner'; 

import { Button } from '@/components/ui/button'; 

import { Card } from '@/components/ui/card'; 

import { AppCard } from '@/components/dashboard/AppCard'; 

import { App, AppCreate } from '@/lib/types/app.types'; 

import { createApp, fetchApps } from '@/lib/api/endpoints'; 

// 2. INTERFACES E TYPES // PascalCase, sempre exportadas 

export interface AppEditorProps {appId?: number; initialData?: App; onSave?: (app: App) => void ;onCancel?: () => void ;}

export type AppStatus = 'draft' | 'published' | 'archived'; 

// 3. COMPONENTES // PascalCase, sempre exportados como default 

export default function AppEditor({ appId, initialData, onSave, onCancel }: AppEditorProps) {

// 3.1. HOOKS (ordem: state → refs → custom hooks → effects) 

const [app, setApp] = useState<App | null >(initialData || null ); 

const [isLoading, setIsLoading] = useState( false ); 

const [errors, setErrors] = useState<Record<string, string>>({}); 

const router = useRouter(); 

const { data: apps, isLoading: isLoadingApps } = useApps(); 

// 3.2. CALLBACKS E HANDLERS // useCallback para funções passadas como props 

const handleSave = useCallback( async (data: AppCreate) => {setIsLoading( true ); setErrors({}); 

try {

const savedApp = await createApp(data); toast.success('App criado com sucesso!'); onSave?.(savedApp); router.push(`/apps/ ${ savedApp.id }`); } catch (error) {

if (error instanceof ValidationError) {

# 99 setErrors(error.errors); } else {toast.error('Erro ao criar app. Tente novamente.'); }} finally {setIsLoading( false ); }}, [onSave, router]); 

// 3.3. EFFECTS 

useEffect(() => {

if (appId && !initialData) {fetchAppData(appId); }}, [appId, initialData]); 

// 3.4. RENDER // Early returns primeiro 

if (isLoadingApps) {

return <LoadingSpinner />; }

if (!app && appId) {

return <NotFound message="App não encontrado" />; }

// JSX principal 

return (<div className="container mx-auto py-8"> <Card className="p-6"> <h1 className="text-2xl font-bold mb-6"> {appId ? 'Editar App' : 'Criar Novo App'} </h1> <AppForm initialData={app} errors={errors} isLoading={isLoading} onSubmit={handleSave} onCancel={onCancel} /> </Card> </div> ); }

// 4. CUSTOM HOOKS // Prefixo 'use', snake_case ou camelCase 

export function useApps() {

const [apps, setApps] = useState<App[]>([]); 

const [isLoading, setIsLoading] = useState( true ); 

const [error, setError] = useState< Error | null >( null ); useEffect(() => {

async function loadApps() {

try {

const data = await fetchApps(); setApps(data); } catch (err) {setError(err as Error ); } finally {setIsLoading( false ); }

# 100 }loadApps(); }, []); 

return { apps, isLoading, error }; }

// 5. UTILITÁRIOS // camelCase, sempre exportados 

export function formatDate(date: string | Date): string {

return new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', }).format( new Date(date)); }

// 6. CONSTANTES // UPPER_CASE para valores primitivos 

export const MAX_APP_NAME_LENGTH = 100; 

export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es', 'it', 'fr', 'de', 'jp'] as const ;

// PascalCase para objetos/arrays complexos 

export const AppStatusConfig = {draft: { label: 'Rascunho', color: 'gray' }, published: { label: 'Publicado', color: 'green' }, archived: { label: 'Arquivado', color: 'red' }, } as const ;

// 7. VALIDAÇÃO // Usar Zod para schemas de validação 

import { z } from 'zod'; 

export const appCreateSchema = z.object({ name: z.string() .min(3, 'Nome deve ter no mínimo 3 caracteres') .max(100, 'Nome deve ter no máximo 100 caracteres'), language: z.enum(['pt', 'en', 'es', 'it', 'fr', 'de', 'jp']), description: z.string().optional(), login_config: z.object({ background_url: z.string().url().optional(), logo_url: z.string().url().optional(), headline: z.string().max(200), button_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), }), }); 

export type AppCreateInput = z.infer< typeof appCreateSchema>; 

// 8. JSX // Sempre com formatação consistente 

function ProductCard({ product, onClick }: ProductCardProps) {

return (<Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onClick(product.id)} ><CardHeader> <img src={product.logo_url} alt={product.name} 

# 101 className="w-full h-48 object-cover rounded-t-lg" /> </CardHeader> <CardContent> <h3 className="text-lg font-semibold">{product.name}</h3> <p className="text-sm text-muted-foreground mt-2"> {product.description} </p> </CardContent> <CardFooter> <Button variant="outline" className="w-full"> Ver Detalhes </Button> </CardFooter> </Card> ); }

# 102 2.5.3 Convenções de Nomenclatura 

# 103 Tipo Convenção Exemplo Python 

Classes PascalCase AppService , UserRepository 

Funções/Métodos snake_case create_app , valid‐ ate_webhook 

Variáveis snake_case user_id , is_published 

Constantes UPPER_SNAKE_CASE MAX_FILE_SIZE , JWT_SECRET 

Módulos/Arquivos snake_case app_service.py ,

> auth_utils.py

TypeScript/React 

Componentes PascalCase AppEditor , ProductCard 

Interfaces/Types PascalCase AppCreate , UserResponse 

Funções camelCase handleSubmit , fetchApps 

Variáveis camelCase userId , isLoading 

Constantes Primitivas UPPER_CASE MAX_LENGTH , API_URL 

Constantes Objetos PascalCase AppStatusConfig 

Hooks useCamelCase useAuth , useProducts 

Arquivos Componentes PascalCase AppEditor.tsx 

Arquivos Utilitários camelCase validation.ts , helpers.ts 

Database 

Tabelas snake_case_plural users , user_app_access 

Colunas snake_case user_id , created_at 

Índices idx_table_column idx_users_email 

Foreign Keys fk_table_column fk_apps_user_id 

APIs 

Endpoints kebab-case 

# 104 Tipo Convenção Exemplo 

/api/v1/ apps , /api/v1/push-notifica‐ tions 

Query Params snake_case ?user_id=1&created_after=202 5-01-01 

JSON Keys snake_case {"user_id": 1, "cre‐ ated_at": "..."} 

# 105 2.5.4 Estrutura de Documentação 

docs/ ├── README.md # Overview do projeto 

│├── getting-started/ # Guias de início rápido 

│ ├── installation.md # Instalação local 

│ ├── docker-setup.md # Setup com Docker 

│ └── first-app.md # Criar primeiro app 

│├── architecture/ # Documentação de arquitetura 

│ ├── overview.md # Visão geral da arquitetura 

│ ├── database-schema.md # Schema do banco de dados 

│ ├── api-design.md # Design da API 

│ └── diagrams/ # Diagramas (mermaid, draw.io) 

│ ├── system-architecture.png │ ├── data-flow.png │ └── er-diagram.png │├── api/ # Documentação da API 

│ ├── README.md # Overview da API 

│ ├── authentication.md # Autenticação e autorização 

│ ├── endpoints/ # Endpoints por domínio 

│ │ ├── apps.md │ │ ├── products.md │ │ ├── modules.md │ │ └── webhooks.md │ └── examples/ # Exemplos de requisições 

│ └── postman-collection.json │├── development/ # Guias para desenvolvedores 

│ ├── coding-standards.md # Padrões de código 

│ ├── testing.md # Guia de testes 

│ ├── ci-cd.md # CI/CD pipeline 

│ └── troubleshooting.md # Resolução de problemas 

│├── deployment/ # Guias de deployment 

│ ├── aws.md # Deploy na AWS 

│ ├── docker.md # Deploy com Docker 

│ └── environment-variables.md # Variáveis de ambiente 

│└── user-guides/ # Guias para usuários finais 

├── creating-app.md # Como criar um app 

├── adding-products.md # Como adicionar produtos 

└── integrations.md # Como integrar plataformas 

Exemplo de README.md: 

# 106 # AppSell Platform > Plataforma SaaS no-code para criação de aplicativos móveis para venda e entrega de produtos digitais. 

## 📋 Índice 

- [Sobre ](#sobre) 

- [Tecnologias ](#tecnologias) 

- [Começando ](#começando) 

- [Documentação ](#documentação) 

- [Contribuindo ](#contribuindo) 

- [Licença ](#licença) 

## 🎯 Sobre 

AppSell é uma plataforma completa que permite criadores de conteúdo transformarem seus e-books, cursos e infoprodutos em aplicativos móveis profissionais, sem necessidade de código. 

**Principais Features:** - ✨ Criação de apps sem código 

- 📱 Apps nativos iOS e Android 

- 💰 Sistema de upsells integrado 

- 🔔 Push notifications 

- 📊 Analytics e relatórios 

- 🔗 Integração com Hotmart, Kiwify, Monetizze 

## 🚀 Tecnologias 

### Backend - **FastAPI** 0.104+ (Python 3.11+) 

- **PostgreSQL** 15+ 

- **Redis** 7+ 

- **Celery** para background jobs 

- **SQLAlchemy** 2.x (async) 

### Frontend Admin - **Next.js** 14+ (App Router) 

- **React** 18+ 

- **TypeScript** 5+ 

- **Tailwind CSS** 3+ 

- **shadcn/ui** ### Mobile App - **React Native** 0.73+ 

- **TypeScript** 5+ 

- **React Navigation** 6+ 

- **Zustand** (state management) 

## 🏁 Começando 

### Pré-requisitos - Docker e Docker Compose 

- Node.js 18+ e npm/yarn 

- Python 3.11+ 

- Git 

### Instalação Rápida (Docker) 

```bash 

# 107 # Clone o repositório 

git clone https://github.com/seu-usuario/appsell-platform.git cd appsell-platform 

# Copie o arquivo de ambiente 

cp .env.example .env 

# Inicie os serviços 

docker-compose up -d 

# Acesse: # - API: http://localhost:8000 # - Admin: http://localhost:3000 # - Docs API: http://localhost:8000/docs 

# Instalação Manual 

Veja guias detalhados em: - Backend Setup (docs/getting-started/backend-setup.md) 

- Frontend Setup (docs/getting-started/frontend-setup.md) 

- Mobile Setup (docs/getting-started/mobile-setup.md) 

# 📚 Documentação 

API Reference (docs/api/README.md) - Documentação completa da API 

Arquitetura (docs/architecture/overview.md) - Visão geral da arquitetura 

Guia de Desenvolvimento (docs/development/coding-standards.md) - Padrões e práticas 

Deployment (docs/deployment/aws.md) - Guias de deploy 

# 🤝 Contribuindo 

Contribuições são bem-vindas! Por favor, leia nosso Guia de Contribuição (CONTRIBUTING.md) .Fork o projeto Crie uma branch para sua feature ( git checkout -b feature/AmazingFeature )Commit suas mudanças ( git commit -m 'Add some AmazingFeature' )Push para a branch ( git push origin feature/AmazingFeature )Abra um Pull Request 

# 📄 Licença 

Este projeto está sob a licença MIT. Veja LICENSE (LICENSE) para mais detalhes. 

# 👥 Time 

Tech Lead - @seu-usuario (https://github.com/seu-usuario) 

Backend - Time Backend 

Frontend - Time Frontend 

# 🙏 Agradecimentos 

Inspirado no AppSell original ••••1. 2. 3. 4. 5. ••••

# 108 Comunidade FastAPI Comunidade React Native ••

# 109 ---

## 3. PROMPT DETALHADO PARA DESENVOLVIMENTO ### 3.1 Prompt Completo para IA/LLM 

```markdown 

# PROMPT PARA DESENVOLVIMENTO DA PLATAFORMA APPSELL 

Você é um engenheiro de software sênior especializado em desenvolvimento full-stack. Seu objetivo é desenvolver uma plataforma SaaS completa para criação de aplicativos mó‐ veis para venda de produtos digitais (infoprodutos). 

## CONTEXTO DO PROJETO 

**Nome:** AppSell Platform **Tipo:** SaaS B2B no-code **Propósito:** Permitir que criadores de conteúdo (infoprodutores) transformem seus e-books, cursos e produtos digitais em aplicativos móveis profissionais sem escrever cód igo. **Usuários-alvo:** - **Primário:** Criadores de conteúdo, coaches, consultores, infoprodutores - **Secundário:** Usuários finais que consomem o conteúdo nos apps 

## REQUISITOS FUNCIONAIS COMPLETOS ### 1. PAINEL ADMINISTRATIVO WEB 

Desenvolva um painel web responsivo onde admins possam: 

#### 1.1 Gestão de Apps 

- Criar novos aplicativos - Customizar tela de login: - Upload de background (JPG/PNG, max 5MB) - Upload de logo (PNG com transparência preferível) - Definir headline de boas-vindas (max 200 chars) - Escolher cores de botões e texto (color picker) - Ajustar tamanho do logo - Customizar tela home: - Upload de banners rotativos (carousel, max 5 banners) - Selecionar estilo de exibição de produtos: - Original (grid tradicional) - Netflix (horizontal scroll com cards) - Definir número de colunas para produtos (1-3) - Escolher cores de títulos - Ativar/desativar gradiente de fundo - Nomear seções de produtos (ex: "Seus Treinos", "Acelere Resultados") - Configurar dados gerais: - Nome do aplicativo (único por usuário) - Idioma (suportar: PT, EN, ES, IT, FR, DE, JP) - Tipo de login (completo, direto, facilitado) - Descrição do app (SEO-friendly) - Email de suporte - WhatsApp de suporte (com validação de formato internacional) - Toggle para botão de página de vendas - Toggle para exibição de evolução do curso - Visualizar preview em tempo real do app - Publicar/despublicar apps - Gerar link de acesso para distribuição - Duplicar apps existentes - Arquivar/deletar apps (com confirmação) 

# 110 #### 1.2 Gestão de Produtos 

- Criar produtos associados a apps específicos - Definir tipo de oferta: - Produto Principal - Order Bump - Upsell/Downsell - Bônus - Configurar regras de liberação: - Imediato (libera assim que compra é processada) - Data específica (escolher data/hora) - Dias após compra (X dias após webhook de compra) - Integrar com plataformas de pagamento: - Hotmart (inserir Product ID) - Kiwify (inserir Product ID) - Monetizze (inserir Product ID) - Braip (inserir Product ID) - Upload de logos: - Logo liberado (quando usuário tem acesso) - Logo bloqueado (para upsells não comprados) - Configurar URL de página de vendas (para produtos bloqueados) - Definir ordem de exibição (drag-and -drop) - Layout em colunas para módulos - Ocultar nome do produto (opcional) - Editar/arquivar/deletar produtos 

#### 1.3 Gestão de Módulos e Conteúdo 

- Criar módulos dentro de produtos - Definir nome e descrição do módulo - Upload de imagem de capa para módulo - Adicionar múltiplos conteúdos por módulo - Suportar formatos de conteúdo: - **Arquivo Incorporado:** PDF, DOC, PPT (max 500MB) - **Download:** Qualquer arquivo para download - **Áudio:** MP3, WAV (player nativo) - **Editor de Texto:** Rich text editor (WYSIWYG) - **HTML Customizado:** Editor de código HTML/CSS - **Link Externo:** Redirecionar para URL externa - **Página Web:** Incorporar website via iframe - **Google Drive PDF:** Link para PDF hospedado no Drive - **Vimeo:** Incorporar vídeos (suporte a vídeos privados com senha) - **Panda Videos:** Integração com Panda - **VSL Play / Host VSL:** Vídeos de vendas - **YouTube:** Incorporar vídeos (públicos, não-listados ou privados) - Opção de ocultar player do YouTube (remover branding) - Configurar abertura: - Direta (abre conteúdo imediatamente) - Com capa customizada (exibe imagem antes de abrir) - Definir regras de liberação por conteúdo - Reordenar módulos e conteúdos (drag-and -drop) - Editar/deletar módulos e conteúdos 

#### 1.4 Push Notifications 

- Criar notificações push - Definir título (max 100 chars) e mensagem (max 250 chars) - Segmentar destinatários: - Todos os usuários do app - Usuários específicos (por email/ID) - Usuários de produto específico - Agendar envio (data/hora ou imediato) - Visualizar histórico de notificações enviadas - Ver estatísticas (entregues, abertos, clicados) 

# 111 #### 1.5 Analytics e Relatórios 

- Dashboard com métricas principais: - Total de vendas (período configurável) - Receita total - Número de usuários ativos - Taxa de conclusão de conteúdo - Gráficos: - Vendas ao longo do tempo (linha) - Vendas por produto (barras) - Funil de conversão - Engajamento de usuários - Exportar relatórios: - CSV - Excel - PDF (com gráficos) 

#### 1.6 Integrações 

- Configurar webhooks de plataformas de pagamento - Testar webhooks manualmente - Visualizar logs de webhooks (últimos 100) - Configurar Firebase Cloud Messaging (FCM) para push - Integrar com email service (SendGrid/AWS SES) - Configurar domínio customizado 

#### 1.7 Gestão de Clientes 

- Visualizar lista de clientes (usuários finais) - Filtrar por app, produto, data de compra - Ver histórico de compras de cada cliente - Ver progresso de curso de cada cliente - Enviar email de recuperação de acesso - Desativar/reativar acesso manualmente 

### 2. APLICATIVO MÓVEL (iOS/Android) 

Desenvolva um app React Native com: 

#### 2.1 Autenticação 

- Tela de login customizada (baseada em config do admin) - Campos: email, senha - Botão "Criar Conta" (leva para tela de registro) - Botão "Esqueci a Senha" - Validação de formato de email - Armazenamento seguro de token (Keychain iOS / Keystore Android) - Auto-login se token válido - Logout 

#### 2.2 Home Screen 

- Exibir banner rotativo (swipeable carousel) - Banners clicáveis (abrem link externo ou produto) - Listar produtos liberados - Exibir em estilo Original ou Netflix (conforme config) - Mostrar logo, nome do produto - Listar produtos bloqueados (upsells) - Visual diferenciado (lock icon, opacidade) - Ao clicar: abrir página de vendas no browser - Seção de bônus - Produtos marcados como bônus - Botão de WhatsApp (fixed bottom-right) - Abre WhatsApp com número de suporte 

#### 2.3 Produto e Módulos 

- Tela de produto: - Banner/logo do produto 

# 112 - Lista de módulos - Indicador de progresso geral - Tela de módulo: - Lista de conteúdos - Status de cada conteúdo (não iniciado, em progresso, concluído) - Capa de cada conteúdo - Tempo estimado (se disponível) 

#### 2.4 Visualização de Conteúdo 

- **PDF:** - Visualizador nativo de PDF - Zoom, scroll, busca de texto - Botão de download (se permitido) - Botão "Marcar como Concluído" - **Vídeo:** - Player nativo (react-native-video ou Expo AV) - Controles padrão (play, pause, seek, fullscreen) - Salvar progresso automaticamente - Retomar de onde parou - **Áudio:** - Player de áudio com controles - Background playback (opcional) - **Texto/HTML:** - Renderização de HTML com WebView - Suporte a imagens, formatação, links - **Link Externo:** - Abrir em browser externo ou WebView - Opção de voltar para o app 

#### 2.5 Progresso e Gamificação 

- Marcar conteúdos como concluídos - Exibir barra de progresso por módulo e por produto - Badge/animação ao completar módulo - Histórico de atividades 

#### 2.6 Push Notifications 

- Receber notificações push via FCM - Exibir banner de notificação - Ao clicar: abrir conteúdo específico ou home - Configurações de notificações (ativar/desativar) 

#### 2.7 Perfil do Usuário 

- Visualizar dados pessoais - Editar perfil (nome, foto) - Ver produtos comprados - Ver progresso total - Sair da conta 

### 3. BACKEND API 

Desenvolva uma API REST com FastAPI: 

#### 3.1 Autenticação e Autorização 

- **POST /api/v1/auth/register** - Registrar admin - Body: {email, password, full_name} - Validações: email único, senha forte (min 8 chars, maiúscula, número) - Hash de senha com bcrypt (cost factor 12) - **POST /api/v1/auth/login** - Login admin - Body: {email, password} - Retorna: {access_token, refresh_token} - JWT com validade de 1h - **POST /api/v1/auth/refresh** - Renovar token - **POST /api/v1/auth/logout** - Logout (invalidar token) 

# 113 - **POST /api/v1/auth/forgot-password** - Recuperar senha - Enviar email com link de reset - **POST /api/v1/users/login** - Login usuário final (app móvel) - Body: {email, password, app_slug} - Retorna token específico para o app 

#### 3.2 Apps 

- **POST /api/v1/apps** - Criar app - Gerar slug único - Validar unicidade de nome por usuário - **GET /api/v1/apps** - Listar apps do usuário - Paginação (skip, limit) - Filtros (is_published, language) - **GET /api/v1/apps/{id}** - Detalhes do app - **PATCH /api/v1/apps/{id}** - Atualizar app - Validar ownership - **POST /api/v1/apps/{id}/publish** - Publicar app - Validar se app tem pelo menos 1 produto - Gerar access_link se não existir - **DELETE /api/v1/apps/{id}** - Deletar app - Soft delete (marcar como archived) 

#### 3.3 Produtos 

- **POST /api/v1/products** - Criar produto - Validar app_id pertence ao usuário - Validar platform_product_id único - **GET /api/v1/apps/{app_id}/products** - Listar produtos do app - **GET /api/v1/products/{id}** - Detalhes do produto - **PATCH /api/v1/products/{id}** - Atualizar produto - **DELETE /api/v1/products/{id}** - Deletar produto 

#### 3.4 Módulos e Conteúdo 

- **POST /api/v1/modules** - Criar módulo - **GET /api/v1/products/{product_id}/modules** - Listar módulos - **PATCH /api/v1/modules/{id}** - Atualizar módulo - **DELETE /api/v1/modules/{id}** - Deletar módulo - **POST /api/v1/contents** - Adicionar conteúdo - **PATCH /api/v1/contents/{id}** - Atualizar conteúdo - **DELETE /api/v1/contents/{id}** - Deletar conteúdo 

#### 3.5 Upload de Arquivos 

- **POST /api/v1/upload** - Upload de arquivo - Multipart form data - Validar tipo de arquivo (whitelist de extensões) - Validar tamanho (max 500MB) - Upload para S3/R2 - Retornar URL do arquivo - Suportar upload chunked para arquivos grandes 

#### 3.6 Webhooks 

- **POST /api/v1/webhooks/hotmart** - Receber webhook Hotmart - Validar assinatura HMAC - Processar eventos: PURCHASE_COMPLETE, PURCHASE_REFUNDED - Criar registro de compra - Conceder/revogar acesso ao usuário - Enfileirar notificações - **POST /api/v1/webhooks/kiwify** - Receber webhook Kiwify - **POST /api/v1/webhooks/monetizze** - Receber webhook Monetizze - **POST /api/v1/webhooks/braip** - Receber webhook Braip **Processamento de Webhook:** ```python 

# 114 1. Validar assinatura 2. Extrair dados: {buyer_email, product_id, transaction_id, status, amount} 3. Buscar produto no banco via platform_product_id 4. Se produto não encontrado: log erro, retornar 404 5. Criar registro em `purchases` table 6. Se status == "approved": a. Criar/atualizar registro em `user_app_access` b. Aplicar regras de liberação de conteúdo c. Cachear produtos liberados no Redis d. Enfileirar tarefas: - Enviar email de boas-vindas - Enviar push notification 7. Se status == "refunded": a. Revogar acesso em `user_app_access` b. Invalidar cache 8. Retornar 200 OK 

## 3.7 Usuários Finais (Mobile API) 

GET /api/v1/users/me - Dados do usuário autenticado 

PATCH /api/v1/users/me - Atualizar perfil 

GET /api/v1/users/me/products - Listar produtos liberados Filtrar produtos pelos quais o usuário tem acesso Retornar módulos e conteúdos liberados Marcar upsells bloqueados 

POST /api/v1/users/me/progress - Marcar conteúdo como concluído Body: {content_id, completed: true} Atualizar user_progress table 

GET /api/v1/users/me/progress - Obter progresso Retornar porcentagem de conclusão por produto 

## 3.8 Notificações 

POST /api/v1/notifications/push - Criar notificação push Validar app pertence ao usuário Se agendado: salvar com status “scheduled” Se imediato: enfileirar tarefa Celery 

GET /api/v1/notifications - Listar notificações Filtrar por app Paginação 

## 3.9 Analytics 

GET /api/v1/analytics/sales - Estatísticas de vendas Query params: app_id, start_date, end_date Retornar: total_sales, total_revenue, by_product, daily_breakdown 

GET /api/v1/analytics/engagement - Métricas de engajamento Retornar: active_users, avg_session_duration, content_completion_rate 

## 3.10 Health Checks 

GET /health - Health check simples Retornar: {status: “healthy”} 

GET /health/detailed - Health check detalhado Verificar: database, redis, s3 •••••••••••••••••••••••••••

# 115 Retornar status de cada componente 

# 4. BACKGROUND JOBS (Celery) 

Implementar tarefas assíncronas: 

## 4.1 Tasks de Email 

send_welcome_email 

Enviar email de boas-vindas após compra Template HTML personalizado Incluir link de acesso ao app Retry: 3 tentativas com backoff exponencial 

send_access_recovery_email 

Enviar email para usuários inativos (configurable: 7, 14, 30 dias) Incluir link mágico de login 

send_new_content_notification_email 

Enviar email quando novo conteúdo é liberado 

## 4.2 Tasks de Notificação 

send_push_notification 

Enviar notificação via Firebase Cloud Messaging Batch de max 1000 tokens por requisição Retry em caso de falha Invalidar tokens inativos 

send_scheduled_notifications 

Task agendada (Celery Beat) a cada minuto Buscar notificações com status “scheduled” e data <= now Enviar e atualizar status para “sent” 

## 4.3 Tasks de Conteúdo 

process_uploaded_file 

Gerar thumbnail para vídeos Comprimir imagens (max 1920px largura) Extrair metadados de arquivos (duração de vídeo, páginas de PDF) Scan de vírus (ClamAV) 

apply_content_release_rules 

Task agendada (Celery Beat) a cada hora Buscar produtos/conteúdos com release_type=”days_after_purchase” ou “date” Se data atual >= data de liberação: liberar conteúdo Enviar notificação ao usuário 

## 4.4 Tasks de Limpeza 

cleanup_old_sessions 

Task diária Remover tokens JWT expirados do Redis 

cleanup_unused_files 

Task semanal Remover arquivos do S3 que não estão vinculados a nenhum conteúdo ••••••••••••••••••••••••••••••••••••

# 116 5. BANCO DE DADOS 

Implementar schema PostgreSQL conforme especificado na seção 2.1.4. 

Pontos críticos: 

- Usar JSONB para configurações flexíveis (login_config, home_config) - Criar índices para queries comuns - Implementar constraints de foreign key - Usar timestamps (created_at, updated_at) em todas as tabelas - Soft delete para dados sensíveis (usar is_deleted flag) 

# 6. CACHE E PERFORMANCE 

Redis: 

Cache de sessões (JWT tokens) Cache de produtos liberados por usuário (TTL 1h) Cache de configurações de app (TTL 24h) Rate limiting (token bucket algorithm) Celery broker e result backend 

Estratégias de Cache: 

Invalidação ao atualizar produto/módulo/conteúdo Cache warming para apps publicados Cache de analytics (TTL 5min) 

# 7. SEGURANÇA 

Implementar: 

Autenticação: 

JWT com access token (1h) e refresh token (7 dias) Refresh token rotation Invalidação de tokens no logout Rate limiting em endpoints de login (5 tentativas/min por IP) 

Autorização: 

Middleware para verificar ownership (user_id == resource.user_id) Role-based access control (admin vs usuário final) 

Proteção de Dados: 

Criptografia de senhas com bcrypt HTTPS obrigatório em produção Secrets em variáveis de ambiente (não commitar) Sanitização de inputs (prevenir XSS, SQL injection) 

Webhooks: 

Validação de assinatura HMAC Whitelist de IPs das plataformas (opcional) Idempotência (não processar mesmo evento 2x) •••••••••••••••••••••••••••

# 117 Upload de Arquivos: 

Validação de tipo MIME Validação de tamanho Scan de vírus Nomes de arquivo randomizados (prevenir path traversal) 

# 8. TRATAMENTO DE ERROS 

API: 

Retornar códigos HTTP apropriados Mensagens de erro claras e acionáveis Não expor stack traces em produção Log de erros com contexto (request_id, user_id, etc.) 

Frontend: 

Toast notifications para erros Mensagens amigáveis ao usuário Opção de retry para operações falhadas 

Background Jobs: 

Retry automático com backoff exponencial Dead letter queue para tarefas que falharam após retries Alertas para admin quando tarefas críticas falham 

# 9. LOGGING E MONITORAMENTO 

Logging: 

Logs estruturados em JSON Níveis: DEBUG, INFO, WARNING, ERROR, CRITICAL Log de todas as requisições (method, path, status, duration) Log de ações críticas (criação de app, compra processada, etc.) NÃO logar informações sensíveis (senhas, tokens, PII) 

Monitoramento: 

Health checks expostos para load balancer Métricas Prometheus: Requisições por endpoint Duração de requisições Taxa de erro Tamanho da fila do Celery Alertas: Taxa de erro > 5% Tempo de resposta > 1s Uso de CPU/RAM > 80% Banco de dados down 

APM: 

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

•

◦

◦

◦

◦

•

◦

◦

◦

◦

•

# 118 Sentry para tracking de erros Distributed tracing (OpenTelemetry) 

# 10. TESTES 

Implementar cobertura de testes ≥ 80%: 

## 10.1 Testes Unitários (pytest) 

Testar serviços isoladamente (mock de dependencies) Testar validações de schemas (Pydantic) Testar utilitários e helpers Testar funções de negócio complexas 

## 10.2 Testes de Integração 

Testar endpoints da API (mock de serviços externos) Testar operações de banco de dados Testar webhooks (simular payloads) 

## 10.3 Testes E2E 

Simular fluxo completo de usuário: Registrar → Criar app → Adicionar produto → Processar compra → Acessar no mobile Usar fixtures para popular banco de testes 

## 10.4 Testes Frontend (Vitest + Testing Library) 

Testar componentes isoladamente Testar interações do usuário Testar formulários e validações Snapshot tests para componentes críticos 

# 11. DOCUMENTAÇÃO 

Gerar documentação automática: 

API: 

OpenAPI/Swagger via FastAPI (rota /docs) Incluir exemplos de requisições/respostas Documentar todos os endpoints, parâmetros, body schemas 

Código: 

Docstrings em formato Google para todas as funções públicas Type hints obrigatórios em Python e TypeScript Comentários para lógica complexa 

README: 

Como rodar localmente Como fazer deploy Estrutura do projeto Variáveis de ambiente necessárias •••••••••••••••••••••••••••••

# 119 12. CI/CD 

Configurar GitHub Actions: 

CI Pipeline: 

Rodar linter (ESLint, Pylint) Rodar testes Verificar cobertura de testes Build de imagens Docker Scan de vulnerabilidades (Trivy) 

CD Pipeline: 

Deploy automático em staging (branch develop )Deploy manual em produção (branch main com aprovação) Rollback automático em caso de falha de health check 

# 13. ENTREGÁVEIS 

Ao final do desenvolvimento, entregar: 

Código Fonte: 

- Backend (FastAPI) - repositório Git - Frontend Admin (Next.js) - repositório Git - Mobile App (React Native) - repositório Git 

Documentação: 

- README.md detalhado em cada repositório - Documentação de API (Swagger) - Diagramas de arquitetura (Mermaid ou PNG) - Guia de deployment 

Infraestrutura: 

- Docker Compose para desenvolvimento - Dockerfiles otimizados para produção - Scripts de CI/CD (GitHub Actions) - Terraform/CloudFormation (opcional para AWS) 

Testes: 

- Suite de testes unitários - Suite de testes de integração - Testes E2E básicos 

Configurações: 

- Arquivos .env.example - nginx.conf para reverse proxy - Scripts de inicialização (init_db.py, seed_data.py) 

# STACK TECNOLÓGICA OBRIGATÓRIA 

Backend: FastAPI (Python 3.11+), PostgreSQL 15+, Redis 7+, Celery, SQLAlchemy 2.x (async) 

Frontend Admin: Next.js 14+ (App Router), React 18+, TypeScript 5+, Tailwind CSS 3+, shadcn/ ui ••••••••••1. 2. 3. 4. 5. ••

# 120 Mobile: React Native 0.73+, TypeScript 5+, React Navigation 6+, Zustand 

Infraestrutura: Docker, AWS S3/Cloudflare R2, Firebase Cloud Messaging 

# PADRÕES E BOAS PRÁTICAS 

Código Limpo: 

Siga PEP 8 (Python) e Airbnb Style Guide (TypeScript) Nomes descritivos de variáveis e funções Funções pequenas (max 50 linhas) Evitar código duplicado (DRY) 

Arquitetura: 

Separação clara de camadas (API, Service, Repository, Model) Dependency Injection Repository Pattern para acesso a dados Service Layer para lógica de negócio 

Git: 

Commits semânticos (Conventional Commits) Branches: main, develop, feature/ , bugfix/ 

Pull Requests obrigatórios com code review 

Segurança: 

Nunca commitar secrets Validar todos os inputs Sanitizar outputs Rate limiting em todas as APIs públicas 

# PRIORIDADES DE DESENVOLVIMENTO 

# Fase 1 (MVP) - Prioridade Alta: 

Backend API básico (autenticação, CRUD de apps, produtos, módulos) Webhook de Kiwify (mais simples) Frontend admin (criação de app, produtos, módulos) Mobile app (login, listagem de produtos, visualização de PDF) 

# Fase 2 - Prioridade Média: 

Push notifications Analytics básico Suporte a mais formatos de conteúdo (vídeo, áudio) Integrações com outras plataformas (Hotmart, Monetizze) 

# Fase 3 - Prioridade Baixa: 

Gamificação avançada Domínio customizado Temas customizáveis •••••••••••••••••••••1. 2. 3. 4. 1. 2. 3. 4. 1. 2. 3. 

# 121 Sistema de afiliados 

# NOTAS FINAIS 

Performance é crítica: Tempos de resposta devem ser < 200ms 

Experiência do usuário é prioridade: Interface intuitiva, sem bugs 

Escalabilidade: Arquitetura deve suportar crescimento (100k+ usuários) 

Manutenibilidade: Código bem documentado e testado 

Segurança: Implementar todas as best practices de segurança Comece pela Fase 1 (MVP) e desenvolva incrementalmente. Cada feature deve ser testada antes de prosseguir para a próxima. BOA SORTE! ``` 

# CONCLUSÃO 

Este documento fornece uma especificação técnica completa e detalhada para construir uma plataforma similar ao AppSell, baseada na análise do vídeo fornecido. 

Principais destaques: 

✅ Análise Completa: Identificação de todas as funcionalidades do vídeo 

✅ Arquitetura Robusta: Tech stack moderno e escalável 

✅ Requisitos Detalhados: Funcionais e não-funcionais bem especificados 

✅ System Design: Diagramas, fluxos de dados e APIs documentadas 

✅ Resiliência: Estratégias de retry, circuit breakers, rate limiting 

✅ Estrutura de Projeto: Organização clara de código e documentação 

✅ Prompt Completo: Instruções detalhadas para desenvolvimento 

Próximos passos recomendados: 

Revisar e validar a especificação com stakeholders Priorizar features (MVP vs. Nice-to-have) Estimar esforço e cronograma Montar equipe de desenvolvimento Configurar ambiente de desenvolvimento Iniciar desenvolvimento por fases (MVP primeiro) Este documento serve como guia completo para desenvolvimento, podendo ser usado por desen‐ volvedores, arquitetos de software ou até mesmo como prompt para LLMs/IA auxiliarem no desenvol‐ vimento. 4. •••••1. 2. 3. 4. 5. 6. 

# 122