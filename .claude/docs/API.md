# API Reference

## Supabase Client

Instância tipada em `src/integrations/supabase/client.ts`. Usar sempre via import:
```ts
import { supabase } from '@/integrations/supabase/client'
```

---

## Tabelas (REST via PostgREST)

### `profiles`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | Igual ao `auth.users.id` |
| `email` | text | |
| `full_name` | text | |
| `avatar_url` | text | |

### `user_roles`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | uuid FK → profiles | UNIQUE |
| `role` | text | `'admin'` \| `'user'` |

### `products`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `admin_id` | uuid FK → profiles | Dono do produto |
| `title` | text | |
| `price` | numeric(10,2) | |
| `payment_platform` | text | hotmart / kiwify / monetizze |
| `external_product_id` | text | ID do produto na plataforma externa |
| `webhook_secret` | text | Chave para validar webhooks |
| `theme_primary/secondary/accent` | text | Cores HSL do tema |
| `is_active` | boolean | |

### `modules`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `type` | enum | `video` \| `pdf` \| `text` \| `quiz` |
| `order_index` | integer | Ordem de exibição |
| `video_url` | text | |
| `pdf_url` | text | |
| `content_text` | text | Para tipo `text` |
| `is_preview` | boolean | Livre sem compra |
| `duration_seconds` | integer | |

### `purchases`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | uuid FK → profiles | UNIQUE com product_id |
| `product_id` | uuid FK → products | |
| `status` | text | `pending` \| `approved` \| `cancelled` \| `refunded` |
| `external_transaction_id` | text | ID da transação na plataforma |
| `amount_paid` | numeric(10,2) | |
| `approved_at` | timestamptz | |
| `expires_at` | timestamptz | null = sem expiração |

### `user_progress`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | uuid FK → profiles | UNIQUE com module_id |
| `module_id` | uuid FK → modules | |
| `completed` | boolean | |
| `progress_percentage` | integer | 0–100 |
| `last_position_seconds` | integer | Para vídeos |
| `completed_at` | timestamptz | |

### `certificates`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | uuid FK → profiles | UNIQUE com product_id |
| `product_id` | uuid FK → products | |
| `certificate_number` | text UNIQUE | Formato: `CERT-YYYY-XXXXXX` |
| `pdf_url` | text | URL do PDF gerado |

### `notifications`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | uuid FK → profiles | |
| `type` | text | `info` \| `success` \| `warning` \| `error` |
| `read` | boolean | |
| `action_url` | text | Link opcional |

---

## Edge Functions

Base URL: `https://<project>.supabase.co/functions/v1/`

### `POST /webhook-payment`
Recebe webhooks das plataformas de pagamento.
- Valida assinatura por `webhook_secret` do produto
- Suporta: Hotmart, Kiwify, Monetizze
- Chama `process-payment` internamente

### `POST /process-payment`
Uso interno. Atualiza `purchases.status` para `approved` e dispara `send-purchase-confirmation`.

### `POST /create-checkout`
Cria sessão de checkout (em desenvolvimento).

### `POST /generate-certificate`
Gera PDF do certificado para `(user_id, product_id)`.
- Cria registro em `certificates` com número único `CERT-YYYY-XXXXXX`
- Salva PDF no Storage

### `POST /reset-user-password`
Reset customizado de senha via admin.

---

## Storage Buckets

| Bucket | Visibilidade | Uso |
|--------|-------------|-----|
| `product-images` | público | Thumbnails, logos de produtos |
| `module-content` | público | Vídeos, PDFs dos módulos |
