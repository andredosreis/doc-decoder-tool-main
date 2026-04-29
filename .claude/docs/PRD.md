# PRD: APP XPRO — Plataforma SaaS de Cursos e Conteúdo Digital

**Versão:** 1.0
**Data:** 2026-04-25
**Responsável:** André dos Reis

---

## Resumo

O **APP XPRO** é uma plataforma SaaS multi-tenant que permite a criadores de conteúdo, educadores e infoprodutores transformar seus materiais em PDF e vídeo em aplicações web progressivas (PWAs) profissionais — sem escrever uma linha de código. Cada criador gerencia seus próprios produtos e alunos de forma isolada, com total independência entre contas.

A proposta de valor central é eliminar a experiência ruim de entrega de conteúdo via PDF bruto: sem rastreamento de progresso, sem notificações, sem suporte mobile. O APP XPRO substitui esse modelo por uma plataforma de entrega moderna, integrada nativamente às maiores plataformas de pagamento do Brasil (**Hotmart, Kiwify, Monetizze, Eduzz**), que processa compras automaticamente via webhook e libera acesso ao conteúdo sem intervenção manual.

O sistema atende **dois perfis de usuário**: **admins** (criadores que publicam e vendem seus cursos) e **alunos** (compradores que consomem o conteúdo). A arquitetura é multi-tenant por `admin_id` — não há tabela de organização separada. Todo isolamento é garantido por RLS no banco de dados.

---

## Contexto e Problema

### Motivação

Criadores de conteúdo digital no Brasil utilizam plataformas como Hotmart e Kiwify para processar pagamentos, mas a entrega do conteúdo é limitada: PDFs enviados por e-mail, links para arquivos no Google Drive, ou plataformas genéricas sem identidade visual própria. Essa experiência é fragmentada, difícil de gerenciar e não oferece rastreamento de engajamento.

O APP XPRO resolve esse problema entregando ao criador uma plataforma pronta, com área de membros profissional, integração automática com as plataformas de pagamento existentes e experiência mobile de alta qualidade via PWA.

### Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Admin (Criador)** | Educador, coach, especialista ou infoprodutor que vende cursos, e-books ou conteúdo estruturado via Hotmart, Kiwify, Monetizze ou Eduzz |
| **Aluno (Comprador)** | Consumidor final que adquiriu um produto do criador e acessa o conteúdo pela plataforma |

### Cenários de Uso Principais

- Criador importa ou cria módulos (vídeo, PDF, texto, quiz) e organiza em um produto/curso
- Aluno compra na Hotmart; webhook dispara automaticamente e libera acesso
- Aluno instala o PWA no celular e consome o curso offline
- Admin acompanha progresso dos alunos e emite certificados de conclusão
- Admin personaliza cores e identidade visual de cada produto individualmente

### Problemas a Resolver

| Problema | Impacto |
|----------|---------|
| Entrega de conteúdo via PDF ou Drive — experiência pobre | Baixo engajamento e alta taxa de abandono |
| Liberação manual de acesso após compra | Operacional lento, propenso a erro |
| Sem rastreamento de progresso do aluno | Criador não sabe quem está consumindo o conteúdo |
| Sem identidade visual própria por produto | Falta de profissionalismo, baixa percepção de valor |
| Gestão dispersa (Hotmart + planilhas + e-mail) | Ineficiência operacional do criador |

---

## Objetivos e Métricas

| Objetivo | Métrica | Meta |
|----------|---------|------|
| Liberar acesso do aluno automaticamente após compra | Tempo entre webhook recebido e acesso liberado | < 30 segundos |
| Garantir disponibilidade da plataforma | Uptime mensal | ≥ 99.5% |
| Reduzir abandono de conteúdo | Taxa de conclusão de módulos por aluno ativo | ≥ 60% |
| Garantir que webhooks não sejam perdidos | Taxa de sucesso no processamento de webhooks | ≥ 99% |
| PWA instalável e funcional no mobile | Score Lighthouse PWA | ≥ 90 |
| Admin publica primeiro produto rapidamente | Tempo até primeiro produto publicado | < 15 minutos |

---

## Escopo

### Incluso — v1.0

**Admin**
- Cadastro e autenticação de admins (self-registration)
- CRUD de produtos com personalização de tema (cor primária, secundária, acento)
- CRUD de módulos por produto (vídeo, PDF, texto, quiz)
- Ordenação de módulos por `order_index`
- Módulos de preview (acesso sem compra)
- Integração e configuração de webhooks por plataforma (Hotmart, Kiwify, Monetizze, Eduzz)
- Gestão de alunos: visualização, convite manual, status de compra
- Listagem e status de compras por produto
- Dashboard com métricas básicas (total de alunos, progresso, compras)
- Configurações de conta e perfil

**Aluno**
- Login por convite (e-mail + senha definida no primeiro acesso)
- Dashboard com cursos adquiridos e progresso
- Player de vídeo com controle de velocidade e posição salva
- Visualizador de PDF integrado
- Leitor de conteúdo textual
- Quiz por módulo
- Rastreamento de progresso por módulo (percentual + concluído)
- Certificado de conclusão gerado automaticamente ao atingir 90% do curso
- Notificações in-app (novas atualizações, conclusões, lembretes)

**Infraestrutura**
- PWA instalável (manifest + service worker)
- Processamento de webhooks de pagamento via Edge Functions Deno
- Isolamento multi-tenant por RLS no PostgreSQL
- Storage segregado por produto (imagens e módulos)
- E-mail de confirmação de compra automático

### Fora do Escopo — v1.0

- Checkout nativo na plataforma (Stripe, Mercado Pago, PIX direto)
- Landing page builder por produto
- Comentários e fórum por módulo
- Anotações pessoais do aluno
- Importação em massa de conteúdo (PDF → módulos automáticos por IA)
- App nativo iOS/Android
- Domínio personalizado por admin
- Análise avançada de engajamento (heatmaps, drop-off por segundo em vídeo)
- Integração com calendário e agendamento de aulas ao vivo
- Notificações push (WhatsApp, e-mail recorrente)
- Internacionalização (i18n) — apenas pt-BR em v1.0

---

## Requisitos Funcionais

### FR-001 — Gestão Multi-Tenant de Produtos

- Admin cria, edita e exclui produtos; cada produto tem `admin_id` como chave de ownership
- Produto contém: título, descrição, preço, imagem, plataforma de pagamento, `external_product_id`, `webhook_secret`, tema de cores (HSL)
- RLS garante que admin A não vê, edita ou exclui produtos do admin B
- Produto pode ser ativado ou desativado (`is_active`); produto inativo não aparece para alunos

### FR-002 — Gestão de Módulos de Conteúdo

- Módulo pertence a um produto; tipos suportados: `video`, `pdf`, `text`, `quiz`
- Módulo com `is_preview = true` é acessível sem compra aprovada
- Ordenação por `order_index` configurável pelo admin via drag-and-drop ou formulário
- Upload de arquivos direto para Supabase Storage; URL armazenada no banco
- Limites de upload: imagens 5 MB, vídeos 500 MB, PDFs 20 MB

### FR-003 — Integração com Plataformas de Pagamento (Webhook)

- Endpoint HTTP POST em Edge Function Deno recebe webhooks das plataformas
- Validação de assinatura por `webhook_secret` do produto antes de processar
- Mapeamento de evento → ação:
  - `PURCHASE_APPROVED` / equivalente → cria/atualiza `purchase.status = 'approved'`
  - `PURCHASE_CANCELLED` → atualiza `status = 'cancelled'`
  - `PURCHASE_REFUNDED` → atualiza `status = 'refunded'`
- Idempotência por `external_transaction_id`: mesmo evento processado N vezes produz o mesmo resultado
- Após aprovação: dispara e-mail de confirmação e notificação in-app para o aluno
- Plataformas suportadas: Hotmart, Kiwify, Monetizze, Eduzz

### FR-004 — Controle de Acesso por Compra (Aluno)

- Aluno acessa módulos somente se possuir `purchase.status = 'approved'` para o produto
- Exceção: módulos com `is_preview = true` são acessíveis sem compra
- Acesso expira se `purchases.expires_at` for preenchido e tiver passado
- Verificação de acesso ocorre no banco via RLS + query no front-end

### FR-005 — Rastreamento de Progresso e Certificados

- Progresso por módulo registrado em `user_progress`: `progress_percentage` (0–100), `last_position_seconds` (vídeos), `completed`
- Módulo marcado como concluído quando `progress_percentage ≥ 90`
- Percentual de conclusão do curso = (módulos concluídos / total de módulos) × 100
- Quando curso atinge 90% de conclusão: Edge Function `generate-certificate` cria PDF do certificado
- Certificado tem número único no formato `CERT-YYYY-XXXXXX`, salvo no Storage e registrado em `certificates`
- Aluno pode visualizar e baixar o certificado pela área de aluno

### FR-006 — Sistema de Notificações In-App

- Notificações criadas pela Edge Function `send-notification` após eventos-chave (compra aprovada, certificado gerado, novo módulo publicado)
- Notificação tem tipo (`info`, `success`, `warning`, `error`), mensagem, `action_url` e flag `read`
- Aluno visualiza notificações em dropdown no header; marca como lida individualmente ou em bloco
- Contagem de não-lidas exibida como badge no ícone de sino

### FR-007 — Fluxo de Convite e Onboarding do Aluno

- Admin convida aluno por e-mail via painel de gestão de alunos
- Aluno recebe link de configuração de senha (`/student-setup`)
- Após definir senha, aluno é redirecionado para a área de alunos
- Webhook de pagamento também dispara criação de conta do aluno caso ele não exista na plataforma
- Role padrão de aluno: `'user'` em `user_roles`

### FR-008 — PWA e Experiência Mobile

- Aplicação configurada como PWA instalável (Web App Manifest + Service Worker)
- Instalação possível via Chrome/Safari no Android e iOS
- Tema de cor da barra de status reflete o tema do produto acessado
- Interface responsiva com breakpoints para mobile, tablet e desktop

---

## Requisitos Não Funcionais

### Segurança e Isolamento

- Row Level Security (RLS) ativo em todas as tabelas com dados de usuário
- Admin não acessa dados de outro admin em nenhuma query — garantido no banco, não apenas no front-end
- Promoção de role para `'admin'` deve ocorrer exclusivamente via função segura no servidor, não por UPDATE direto do cliente
- Webhook validado por HMAC/assinatura antes de qualquer processamento
- Nenhuma chave secreta (`webhook_secret`, chaves Supabase Service Role) exposta no front-end
- Uploads de arquivo validados por tipo MIME e tamanho antes de serem aceitos pelo Storage

### Performance

- Carregamento inicial da SPA (First Contentful Paint) < 2 segundos em 4G
- Edge Functions respondem ao webhook em < 3 segundos (incluindo operação de banco)
- Queries TanStack Query cacheadas com `staleTime` adequado para evitar refetch desnecessário
- Vídeos carregados via streaming (não download completo antes de play)

### Disponibilidade

- Plataforma disponível ≥ 99.5% ao mês
- Supabase gerencia redundância de banco e Edge Functions; sem infraestrutura própria a gerenciar em v1.0
- Falha de webhook não resulta em perda de evento: plataformas de pagamento re-enviam automaticamente

### Observabilidade

- Logs estruturados nas Edge Functions (JSON) com campos: `event_type`, `product_id`, `external_transaction_id`, `status`, `error`
- Métricas básicas acompanhadas via Supabase Dashboard (latência de Edge Functions, erros de banco)
- Console de erros front-end capturado para diagnóstico (integração futura com Sentry)

### Portabilidade e Manutenção

- Ambiente de desenvolvimento local via `npm run dev` (Vite dev server)
- Schema de banco reproduzível via `EXECUTAR_NO_SUPABASE.sql`
- Variáveis de ambiente em `.env` (nunca commitadas); `.env.example` documentado

---

## Arquitetura e Abordagem

```
┌─────────────────────────────────────────────────────┐
│                  Browser / PWA                      │
│     React + TypeScript + Vite + shadcn/ui           │
│     TanStack Query (cache e estado de servidor)     │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / Supabase JS Client
┌──────────────────▼──────────────────────────────────┐
│                  Supabase                           │
│  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Auth      │  │  PostgreSQL  │  │  Storage   │  │
│  │  (sessão,  │  │  + RLS       │  │  (vídeos,  │  │
│  │  convite,  │  │  (produtos,  │  │  PDFs,     │  │
│  │  reset)    │  │  módulos,    │  │  imagens)  │  │
│  └────────────┘  │  compras,    │  └────────────┘  │
│                  │  progresso)  │                   │
│                  └──────────────┘                   │
│  ┌──────────────────────────────────────────────┐   │
│  │           Edge Functions (Deno)              │   │
│  │  webhook-payment │ process-payment           │   │
│  │  generate-certificate │ send-notification    │   │
│  │  send-purchase-confirmation                  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         ▲
         │ HTTP POST webhook
┌────────┴────────────────────┐
│  Plataformas de Pagamento   │
│  Hotmart / Kiwify /         │
│  Monetizze / Eduzz          │
└─────────────────────────────┘
```

**Fluxo de compra end-to-end:**
1. Aluno compra na Hotmart
2. Hotmart envia POST para `webhook-payment` no Supabase
3. Edge Function valida assinatura, identifica produto por `external_product_id`
4. Cria ou atualiza `purchases` com `status = 'approved'`
5. Cria ou ativa conta do aluno (via `auth.admin.inviteUserByEmail` se não existir)
6. Dispara `send-purchase-confirmation` (e-mail) e `send-notification` (in-app)
7. Na próxima vez que o aluno fizer login, `purchases` com `approved` já está no banco e RLS libera acesso

---

## Decisões e Trade-offs

**Decisão:** Multi-tenant por `admin_id` em vez de tabela de `organizations`
**Justificativa:** Simplicidade de implementação e consultas. Nenhum produto cruza fronteiras de admin.
**Trade-off:** Migrar para modelo com organization no futuro exige alteração de schema e políticas RLS.

---

**Decisão:** Supabase como backend completo (Auth + DB + Storage + Edge Functions)
**Justificativa:** Reduz drasticamente o tempo de desenvolvimento, sem servidores a operar. Escala automaticamente para o volume esperado em v1.0.
**Trade-off:** Vendor lock-in moderado. Migração para infra própria seria custosa, mas improvável antes de escala significativa.

---

**Decisão:** Webhooks processados por Edge Functions Deno sem filas
**Justificativa:** Volume esperado em v1.0 é baixo. Plataformas de pagamento re-enviam eventos em caso de falha.
**Trade-off:** Sem garantia de at-least-once processing próprio. Idempotência por `external_transaction_id` mitiga duplicatas, mas falhas silenciosas em erros 5xx dependem do retry da plataforma.

---

**Decisão:** Promoção de admin feita no client-side via UPDATE em `user_roles`
**Justificativa:** Simplificação inicial de MVP.
**Trade-off:** Risco de segurança — qualquer usuário autenticado pode se promover a admin se a política RLS não for suficientemente restritiva. Deve ser migrado para função de banco com `SECURITY DEFINER` ou Edge Function com validação.

---

**Decisão:** PWA via Vite sem framework de service worker dedicado
**Justificativa:** Mantém a stack simples; conteúdo do curso (vídeo/PDF) é grande demais para cache offline real.
**Trade-off:** Experiência offline limitada. PWA serve principalmente para instalabilidade no mobile, não para uso sem conexão.

---

## Dependências

| Tipo | Dependência |
|------|------------|
| **Infraestrutura** | Supabase (projeto ativo com Auth, Storage e Edge Functions habilitadas) |
| **Pagamento** | Contas configuradas nas plataformas (Hotmart, Kiwify, Monetizze, Eduzz) com webhook apontando para a Edge Function |
| **E-mail** | Supabase SMTP configurado (Resend ou SendGrid recomendados para volume) |
| **Storage** | Buckets `products`, `modules`, `avatars`, `logos` criados e com políticas públicas |
| **Build** | Node.js ≥ 18, npm |
| **Deploy** | Vercel, Netlify ou qualquer CDN estático que suporte SPA routing |

---

## Riscos e Mitigação

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Webhook recebido mas sem aluno correspondente no banco | Compra aprovada sem acesso liberado | Média | Edge Function cria aluno via `auth.admin.inviteUserByEmail` se não existir; log de erro com `external_transaction_id` para reconciliação manual |
| Promoção de admin via client-side explorada | Aluno vira admin e acessa dados de criadores | Baixa (requer usuário autenticado mal-intencionado) | Migrar para Edge Function com validação; revisar política RLS em `user_roles` |
| Plataforma de pagamento muda formato do webhook | Webhooks rejeitados silenciosamente | Baixa | Manter testes de payload por plataforma; log completo do body recebido |
| Limite de Storage do Supabase atingido com vídeos | Upload de novos módulos falha | Média em crescimento | Monitorar uso; migrar vídeos para CDN externo (Cloudflare R2, Bunny.net) antes de atingir limite |
| Aluno sem acesso após compra aprovada | Fricção e suporte manual | Baixa | Dashboard admin mostra status de compra em tempo real; fluxo de desbloqueio manual disponível |
| RLS mal configurada expõe dados entre admins | Vazamento de dados de clientes | Baixa (se schema seguido) | Testes de integração que validam isolamento multi-tenant antes de qualquer deploy |

---

## Critérios de Aceitação

**Fluxo de compra**
- [ ] Webhook de compra aprovada processa em < 30 segundos
- [ ] Aluno sem conta tem convite disparado automaticamente
- [ ] Aluno já cadastrado tem acesso liberado imediatamente após webhook
- [ ] `external_transaction_id` duplicado não cria segunda compra

**Gestão de conteúdo**
- [ ] Admin cria produto com módulos de todos os tipos (vídeo, PDF, texto, quiz)
- [ ] Módulo de preview acessível sem compra
- [ ] Upload de vídeo 100 MB conclui com sucesso
- [ ] Ordenação de módulos persiste após reload

**Área do aluno**
- [ ] Progresso de vídeo salvo ao pausar e retomado na posição correta
- [ ] Módulo marcado como concluído ao atingir 90% do vídeo
- [ ] Certificado gerado automaticamente ao completar o curso
- [ ] Notificação in-app aparece após conclusão de curso

**Segurança**
- [ ] Admin A não consegue visualizar produtos do Admin B
- [ ] Aluno sem compra aprovada não acessa módulos não-preview
- [ ] Webhook com assinatura inválida retorna 401 e não processa

**PWA**
- [ ] Aplicação instalável no Android via Chrome
- [ ] Score PWA no Lighthouse ≥ 90

---

## Testes e Validação

**Testes obrigatórios antes de produção**

- Unitários: validação de assinatura de webhook por plataforma; lógica de cálculo de progresso; geração de número de certificado
- Integração: fluxo completo de webhook (POST → compra aprovada → notificação); acesso negado para aluno sem compra; acesso permitido para módulo preview
- Multi-tenant: verificar que query de Admin A com credencial de Admin B retorna vazio
- Carga: 50 webhooks simultâneos sem perda ou duplicata
- PWA: instalação e navegação básica no Android e iOS

**Ambiente de validação**

- Staging no Supabase com projeto separado do de produção
- Webhooks testados com ferramenta de replay das próprias plataformas (Hotmart Sandbox, Kiwify test mode)
- Deploy em preview branch antes de merge na `main`
