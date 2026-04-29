# FDD-004 — Geração de Certificado

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-28  
**Autor:** André dos Reis  

---

## 1. Contexto

A Edge Function `generate-certificate` já existe em `supabase/functions/generate-certificate/index.ts` mas está funcionalmente incompleta. O estado actual cria a linha em `certificates`, atribui um número único e dispara notificação, mas não gera PDF nem faz upload para Storage. A coluna `certificates.pdf_url` permanece NULL, tornando a feature inutilizável para o aluno.

Este FDD define a substituição completa dessa Edge Function por uma versão que gera o PDF com `pdf-lib`, persiste no bucket privado `certificates` e devolve uma signed URL com TTL 300 s. Mantém idempotência via `UNIQUE(user_id, product_id)` e a notificação `send-notification` já existente.

**Estado actual vs estado alvo:**

| Aspecto | Estado actual | Estado alvo (este FDD) |
|---|---|---|
| Threshold de conclusão | 100% via `user_progress.completed` boolean | 90% via `user_progress.progress_percentage` |
| Cálculo de progresso | Recálculo inline a partir de `completed` por módulo | Leitura do valor agregado em `user_progress` (sem recalcular) |
| Geração de PDF | Não implementada | `pdf-lib` em A4 landscape |
| Upload para Storage | Não implementado | Bucket privado `certificates` |
| Caminho no Storage | N/A | `{user_id}/{certificate_number}.pdf` |
| Coluna `pdf_url` | Sempre NULL | Caminho relativo no bucket |
| Retorno ao frontend | Linha de `certificates` | Linha + signed URL (TTL 300 s) |
| Idempotência | Verificação de linha existente | Verificação de linha existente + verificação de PDF presente em Storage |

---

## 2. Objectivos

- Substituir a Edge Function `generate-certificate` por implementação que gere PDF real, persista em Storage privado e popule `certificates.pdf_url`.
- Garantir entrega imediata via signed URL no retorno da chamada (sem round-trip extra do frontend).
- Preservar idempotência: chamadas repetidas devolvem o mesmo certificado, sem regenerar PDF nem duplicar linhas em `certificates`.
- Manter o trigger de `send-notification` já existente.
- Definir contrato claro com o Sistema de Progresso (FDD-005): a função consulta `user_progress`, não recalcula percentual.
- Configurar bucket `certificates` como privado com RLS apropriada.

Fora do âmbito deste FDD:
- Cálculo do `progress_percentage` agregado por produto (responsabilidade do FDD-005 Sistema de Progresso e Certificação).
- QR code de verificação pública do certificado (alvo v2.0).
- Trigger SQL automático ao atingir 90% via `pg_net` (alvo v2.0; v1.0 mantém chamada explícita do frontend).
- Logo do criador no template do PDF (alvo v1.x).

---

## 3. Decisões Arquitecturais

### 3.1 Biblioteca de PDF

`pdf-lib` via `https://esm.sh/pdf-lib@1.17.1`.

```typescript
import { PDFDocument, StandardFonts, rgb, PageSizes } from "https://esm.sh/pdf-lib@1.17.1"
```

**Justificação:** JavaScript puro, sem dependências nativas, funciona no Deno Edge Runtime. HLD já a indica como candidata. Alternativas (jsPDF, PDFKit, Puppeteer) têm pior compatibilidade com Edge ou exigem mais CPU.

### 3.2 Template e layout

PDF em A4 landscape (842 x 595 pt), texto centrado horizontalmente. Conteúdo:

| Elemento | Conteúdo | Fonte | Tamanho |
|---|---|---|---|
| Título | "Certificado de Conclusão" | Helvetica-Bold | 32 pt |
| Nome do aluno | `profiles.full_name` do utilizador | Helvetica-Bold | 24 pt |
| Texto fixo | "concluiu com aproveitamento o curso" | Helvetica | 14 pt |
| Nome do produto | `products.title` | Helvetica-Bold | 20 pt |
| Texto fixo | "ministrado por" | Helvetica | 12 pt |
| Nome do criador | `profiles.full_name` do `products.admin_id` | Helvetica | 14 pt |
| Data de emissão | `issued_at` formatado pt-PT (ex: "28 de abril de 2026") | Helvetica | 12 pt |
| Número | `CERT-YYYY-XXXXXX` | Helvetica | 10 pt |

Sem logo, sem QR code, sem imagem de fundo na v1.0. Tipografia limpa em fundo branco.

**Justificação:** Mínimo viável que cumpre a função legal e comercial do certificado sem dependências de assets adicionais. Logo do criador e QR de verificação ficam como evolução.

### 3.3 Caminho no Storage

`{user_id}/{certificate_number}.pdf` dentro do bucket `certificates`.

**Justificação:** Estrutura previsível e debugável (admin vê pasta por aluno); `certificate_number` é UNIQUE no schema, logo não há colisão; permite RLS por prefixo `user_id`; remoção em cascata facilitada se uma compra for refundada.

### 3.4 Validação server-side de elegibilidade

A Edge Function consulta `user_progress` para os módulos do produto e verifica que o progresso atinge 90%. **Não recalcula** progresso a partir de eventos primitivos (ex: `completed` boolean por módulo).

Contrato com o Sistema de Progresso (FDD-005):
- Existe uma forma autoritativa de obter o progresso por `(user_id, product_id)`. Em v1.0 imediata, via leitura directa de `user_progress` consolidando os módulos do produto. Em v1.x pode evoluir para view materializada `v_user_product_progress` ou RPC `get_product_progress(user_id, product_id)` sem alteração desta Edge Function.
- O valor lido é tratado como verdade. Re-validar contra eventos primitivos seria duplicação de lógica do FDD-005.

**Justificação:** Evita lógica de progresso duplicada em duas Edge Functions. Concentrar regra de cálculo no Sistema de Progresso reduz risco de divergência (ex: dashboard do aluno mostra 92% e geração de certificado calcula 88% por fórmula diferente).

### 3.5 Idempotência

Garantida por três mecanismos em camadas:

1. **Aplicacional (caminho feliz):** Edge Function consulta `certificates` por `(user_id, product_id)` antes de gerar. Se existir linha com `pdf_url` válido, retorna a existente sem regenerar PDF.
2. **Aplicacional (recovery):** Se existir linha sem `pdf_url` (geração anterior falhou após INSERT), regenera apenas o PDF e faz UPDATE de `pdf_url`. Não cria linha nova.
3. **Schema:** Constraint `UNIQUE(user_id, product_id)` em `certificates` é a última linha de defesa contra race condition entre duas chamadas simultâneas. O handler captura `23505` neste constraint, relê a linha vencedora e retorna idempotente.

Adicionalmente, a constraint `UNIQUE(certificate_number)` pode ser violada por colisão estatística do gerador (Risco C8). O handler aplica loop de retry com `MAX_ATTEMPTS = 5` que gera novo número e re-tenta o INSERT; só após esgotamento das tentativas retorna 500. Isto isola colisão de número (transitória, retentável) de race em `(user_id, product_id)` (terminal, idempotente).

### 3.6 Retorno ao frontend

A Edge Function retorna num único response body:

```typescript
{
  certificate: Certificate, // linha de certificates já com pdf_url
  downloadUrl: string,      // signed URL TTL 300 s
}
```

**Justificação:** Aluno espera download imediato após geração; round-trip extra para gerar URL é desperdício. ServiceLayer mantém `getDownloadUrl()` separado para acessos posteriores (página de listagem de certificados) onde a URL já expirou.

### 3.7 Cliente Supabase service-role para escrita

INSERT em `certificates`, UPDATE de `pdf_url` e upload no bucket exigem service-role. As RLS policies da tabela `certificates` permitem apenas SELECT pelo aluno e pelo admin do produto; não há policy de INSERT ou UPDATE pelo próprio utilizador. Esta restrição é intencional: a emissão do certificado é responsabilidade exclusiva da Edge Function, não do cliente.

A Edge Function usa dois clientes:
- Cliente com JWT do utilizador para validar autenticação e consultar dados onde RLS é desejada (ex: `user_progress`).
- Cliente service-role para ler e escrever em `certificates` e `storage.objects`.

---

## 4. Fluxo end-to-end

```
┌──────────────────────────────────────────────────────────────────┐
│ Aluno conclui módulos; Sistema de Progresso atinge 90%           │
│ (lógica do FDD-005)                                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────┐
   │ Frontend: useGenerateCertificate.mutate(productId)   │
   │ certificatesService.generate(productId)              │
   │ invokeEdgeFunction('generate-certificate', { ... })  │
   └─────────────────────────┬────────────────────────────┘
                             │ HTTPS POST + JWT
                             ▼
   ┌──────────────────────────────────────────────────────┐
   │ Edge Function generate-certificate                   │
   │ 1. Auth: valida JWT, extrai user_id                  │
   │ 2. Lê productId do body                              │
   │ 3. Lê progresso de user_progress                     │
   │    se < 90% retorna 400                              │
   │ 4. Busca dados de profiles + products + admin        │
   │ 5. Verifica certificate existente (idempotência)     │
   │    5a. existe + pdf_url presente: retorna            │
   │    5b. existe + pdf_url null: regenera PDF, UPDATE   │
   │    5c. não existe: gera número, INSERT, gera PDF     │
   │ 6. Renderiza PDF com pdf-lib                         │
   │ 7. Upload para certificates/{user_id}/{number}.pdf   │
   │ 8. UPDATE certificates SET pdf_url = path            │
   │ 9. Gera signed URL TTL 300 s                         │
   │ 10. Dispara send-notification (best-effort)          │
   │ 11. Retorna { certificate, downloadUrl }             │
   └─────────────────────────┬────────────────────────────┘
                             │
                             ▼
   ┌──────────────────────────────────────────────────────┐
   │ Frontend recebe downloadUrl                          │
   │ Abre nova aba ou força download                      │
   └──────────────────────────────────────────────────────┘
```

---

## 5. Implementação

### 5.1 Edge Function (substitui `supabase/functions/generate-certificate/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { PDFDocument, StandardFonts, PageSizes, rgb } from "https://esm.sh/pdf-lib@1.17.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface GenerateCertificateRequest {
  productId: string
}

const MIN_PROGRESS_PERCENTAGE = 90

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) throw new HttpError(401, "Missing authorization header")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new HttpError(401, "User not authenticated")

    const { productId } = (await req.json()) as GenerateCertificateRequest
    if (!productId) throw new HttpError(400, "productId is required")

    const progressPct = await readAggregatedProgress(supabase, user.id, productId)
    if (progressPct < MIN_PROGRESS_PERCENTAGE) {
      throw new HttpError(
        400,
        `Insufficient progress: ${progressPct}% < ${MIN_PROGRESS_PERCENTAGE}%`,
      )
    }

    const { product, adminName, studentName } = await loadCertificateData(
      supabaseAdmin,
      user.id,
      productId,
    )

    const { certificate, isNew } = await ensureCertificateRow(
      supabaseAdmin,
      user.id,
      productId,
    )

    const needsPdf = !certificate.pdf_url
    let finalCertificate = certificate

    if (needsPdf) {
      const pdfBytes = await renderCertificatePdf({
        studentName,
        productTitle: product.title,
        adminName,
        issuedAt: new Date(certificate.issued_at),
        certificateNumber: certificate.certificate_number,
      })

      const path = `${user.id}/${certificate.certificate_number}.pdf`
      const { error: uploadError } = await supabaseAdmin.storage
        .from("certificates")
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        })
      if (uploadError) throw uploadError

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("certificates")
        .update({ pdf_url: path })
        .eq("id", certificate.id)
        .select()
        .single()
      if (updateError) throw updateError
      finalCertificate = updated

      if (isNew) {
        await sendNotification(supabaseAdmin, user.id, productId, product.title)
      }
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(finalCertificate.pdf_url, 300)
    if (signedError) throw signedError

    const status = needsPdf && isNew ? 201 : 200
    return jsonResponse(status, {
      certificate: finalCertificate,
      downloadUrl: signed.signedUrl,
    })
  } catch (error) {
    return errorResponse(error)
  }
})
```

### 5.2 Helpers da Edge Function

**`readAggregatedProgress(client, userId, productId): Promise<number>`**

```typescript
async function readAggregatedProgress(
  client: SupabaseClient,
  userId: string,
  productId: string,
): Promise<number> {
  const { data, error } = await client
    .from("user_progress")
    .select("progress_percentage, modules!inner(product_id)")
    .eq("user_id", userId)
    .eq("modules.product_id", productId)

  if (error) throw error
  if (!data || data.length === 0) return 0

  const sum = data.reduce(
    (acc, row) => acc + (row.progress_percentage ?? 0),
    0,
  )
  return Math.round(sum / data.length)
}
```

> ⚠️ **Dívida temporária:** A consolidação por média across-modules é uma simplificação inline desta Edge Function. O FDD-005 define a fonte de verdade canónica (view ou RPC). Quando disponível, substituir esta query por uma única chamada à primitiva.

**`loadCertificateData(client, userId, productId)`**

```typescript
async function loadCertificateData(
  client: SupabaseClient,
  userId: string,
  productId: string,
) {
  const [productRes, studentRes] = await Promise.all([
    client
      .from("products")
      .select("title, admin_id")
      .eq("id", productId)
      .maybeSingle(),
    client
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
  ])

  if (productRes.error) throw productRes.error
  if (studentRes.error) throw studentRes.error
  if (!productRes.data) throw new HttpError(404, "Product not found")
  if (!studentRes.data) throw new HttpError(404, "Student profile not found")

  const { data: adminProfile, error: adminError } = await client
    .from("profiles")
    .select("full_name")
    .eq("id", productRes.data.admin_id)
    .maybeSingle()
  if (adminError) throw adminError
  if (!adminProfile) throw new HttpError(404, "Admin profile not found")

  return {
    product: productRes.data,
    studentName: studentRes.data.full_name,
    adminName: adminProfile.full_name,
  }
}
```

**`ensureCertificateRow(client, userId, productId)`** garante a linha em `certificates` (idempotente). Diferencia duas violações possíveis de `UNIQUE`:

- `(user_id, product_id)`: corrida entre duas chamadas concorrentes do mesmo aluno+produto. Resposta: relê linha vencedora e retorna idempotente.
- `certificate_number`: colisão estatística do gerador (improvável com `crypto.getRandomValues` mas possível em escala alta; ver Risco C8). Resposta: retentar com novo número até `MAX_ATTEMPTS`.

```typescript
const MAX_INSERT_ATTEMPTS = 5

async function ensureCertificateRow(
  client: SupabaseClient,
  userId: string,
  productId: string,
): Promise<{ certificate: any; isNew: boolean }> {
  const { data: existing } = await client
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle()

  if (existing) return { certificate: existing, isNew: false }

  for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
    const certificateNumber = generateCertNumber()
    const { data: inserted, error } = await client
      .from("certificates")
      .insert({
        user_id: userId,
        product_id: productId,
        certificate_number: certificateNumber,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error) return { certificate: inserted, isNew: true }
    if ((error as any).code !== "23505") throw error

    // 23505: descobrir qual constraint foi violada
    const { data: winner } = await client
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle()

    // Constraint (user_id, product_id): outra chamada venceu, retorna idempotente
    if (winner) return { certificate: winner, isNew: false }

    // Constraint certificate_number: colisão; retentar com novo número
  }

  throw new HttpError(
    500,
    `Falhou alocar certificate_number único após ${MAX_INSERT_ATTEMPTS} tentativas`,
  )
}

function generateCertNumber(): string {
  const year = new Date().getFullYear()
  // crypto.getRandomValues garante distribuição uniforme criptograficamente segura
  // (Math.random tem qualidade insuficiente e bias detectável)
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  const num = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2]
  const random = (num % 1_000_000).toString().padStart(6, "0")
  return `CERT-${year}-${random}`
}
```

**`renderCertificatePdf(data): Promise<Uint8Array>`**

```typescript
interface CertificatePdfData {
  studentName: string
  productTitle: string
  adminName: string
  issuedAt: Date
  certificateNumber: string
}

const MAX_NAME_LENGTH = 60

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + "…"
}

function formatDatePtPt(date: Date): string {
  return date.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

async function renderCertificatePdf(
  data: CertificatePdfData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage(PageSizes.A4.reverse() as [number, number]) // landscape
  const { width, height } = page.getSize()

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const black = rgb(0.1, 0.1, 0.1)

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    bold: boolean,
  ) => {
    const font = bold ? helveticaBold : helvetica
    const textWidth = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y,
      size,
      font,
      color: black,
    })
  }

  drawCentered("Certificado de Conclusão", height - 120, 32, true)
  drawCentered(truncate(data.studentName, MAX_NAME_LENGTH), height - 200, 24, true)
  drawCentered("concluiu com aproveitamento o curso", height - 245, 14, false)
  drawCentered(truncate(data.productTitle, MAX_NAME_LENGTH), height - 290, 20, true)
  drawCentered("ministrado por", height - 330, 12, false)
  drawCentered(truncate(data.adminName, MAX_NAME_LENGTH), height - 360, 14, false)
  drawCentered(`Emitido em ${formatDatePtPt(data.issuedAt)}`, height - 430, 12, false)
  drawCentered(data.certificateNumber, height - 470, 10, false)

  return await pdfDoc.save()
}
```

**`sendNotification`** mantém comportamento da implementação actual: invoca `send-notification` e captura erros como warning sem falhar a chamada principal.

**`jsonResponse` e `errorResponse`** são wrappers triviais para Response com `corsHeaders` e `Content-Type: application/json`. `errorResponse` mapeia `HttpError` para o status correspondente e qualquer outro erro para 500 com mensagem genérica.

### 5.3 Bucket `certificates`

Criar bucket no Supabase Storage:
- Nome: `certificates`
- Público: **não**
- File size limit: 5 MB (PDF típico < 100 KB; margem para evolução com assets)
- Allowed MIME types: `application/pdf`

RLS policies em `storage.objects`:

```sql
-- Aluno lê apenas o seu próprio prefixo
CREATE POLICY "users_read_own_certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Apenas service-role escreve (Edge Function)
CREATE POLICY "service_role_writes_certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates'
  AND auth.role() = 'service_role'
);

-- Admin lê certificados dos seus produtos
CREATE POLICY "admins_read_their_product_certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates'
  AND EXISTS (
    SELECT 1 FROM public.certificates c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.admin_id = auth.uid()
    AND name = c.user_id || '/' || c.certificate_number || '.pdf'
  )
);
```

> ⚠️ Migration deste bucket e respectivas policies acompanha este FDD. Adicionar ao script `EXECUTAR_NO_SUPABASE.sql` ou criar migration dedicada em `supabase/migrations/` (alvo do ADR-012).

### 5.4 ServiceLayer (`certificates.service.ts`)

Já especificado no FDD-003 (secção 5.6). Reproduzido aqui com o ajuste de tipo de retorno de `generate()`:

```typescript
// src/services/certificates.service.ts
import { supabase } from '@/integrations/supabase/client'
import { storageService } from './storage.service'
import { invokeEdgeFunction } from './_edge'
import type { Certificate } from '@/types/domain'

export interface GenerateCertificateResponse {
  certificate: Certificate
  downloadUrl: string
}

export const certificatesService = {
  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async generate(productId: string): Promise<GenerateCertificateResponse> {
    return invokeEdgeFunction<GenerateCertificateResponse>(
      'generate-certificate',
      { productId },
    )
  },

  async getDownloadUrl(cert: Certificate): Promise<string> {
    if (!cert.pdf_url) throw new Error('Certificado sem PDF gerado')
    return storageService.getSignedUrl('certificates', cert.pdf_url, 300)
  },
}
```

### 5.5 Hooks (`useCertificates.ts`)

```typescript
// src/hooks/queries/useCertificates.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { certificatesService } from '@/services/certificates.service'
import { keys } from './keys'
import { toast } from '@/hooks/use-toast'

export const useCertificate = (userId: string, productId: string) =>
  useQuery({
    queryKey: keys.certificates.byUserAndProduct(userId, productId),
    queryFn: () => certificatesService.findByUserAndProduct(userId, productId),
    staleTime: 60 * 60 * 1000, // 1 hora; certificado é imutável após emissão
    enabled: !!userId && !!productId,
  })

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: certificatesService.generate,
    onSuccess: ({ certificate, downloadUrl }) => {
      queryClient.invalidateQueries({
        queryKey: keys.certificates.byUserAndProduct(
          certificate.user_id,
          certificate.product_id,
        ),
      })
      toast({
        title: 'Certificado disponível',
        description: 'Download iniciado em nova aba.',
      })
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    },
  })
}
```

### 5.6 Página `student/Certificate.tsx`

Após migração ao ServiceLayer, a página passa a:
- Usar `useCertificate(userId, productId)` para verificar existência.
- Se existe e tem `pdf_url`: botão "Baixar" chama `certificatesService.getDownloadUrl(cert)` e abre em nova aba.
- Se não existe: botão "Gerar certificado" chama `useGenerateCertificate().mutate(productId)`.
- Estados: `idle`, `pending`, `error` (mensagem do servidor), `success`.

A interceptação de erro "progresso insuficiente" é feita aqui (não no hook): a página mostra empty state explicativo em vez de toast destrutivo.

---

## 6. Tratamento de erros

### 6.1 Códigos de retorno da Edge Function

| Status | Causa | Resposta |
|---|---|---|
| 200 | Certificado existente devolvido (idempotente) ou regenerado (PDF estava em falta) | `{ certificate, downloadUrl }` |
| 201 | Novo certificado criado e PDF gerado | `{ certificate, downloadUrl }` |
| 400 | `productId` ausente; progresso < 90% | `{ error: string }` |
| 401 | JWT ausente ou inválido | `{ error: string }` |
| 404 | Produto, admin ou perfil do aluno não encontrado | `{ error: string }` |
| 500 | Falha em pdf-lib, Storage ou DB | `{ error: string }` |

### 6.2 Cenários de falha e recuperação

| Cenário | Comportamento |
|---|---|
| INSERT em `certificates` succeeds, mas Storage upload falha | Linha fica com `pdf_url = NULL`. Nova chamada cai no caso 5b da idempotência: regenera PDF e faz UPDATE. Sem duplicação de linha. |
| INSERT succeeds, Storage upload succeeds, UPDATE de `pdf_url` falha | Idem: nova chamada lê `pdf_url = NULL`, refaz upload com `upsert: true` e tenta UPDATE de novo. |
| pdf-lib lança em runtime (memória ou CPU) | 500 ao cliente; linha fica com `pdf_url = NULL`; cliente pode retentar. Se persistir, escalar plano (Risco C1). |
| `send-notification` falha | Logado como warning. Não falha a chamada principal. Aluno recebe URL de download mas não recebe notificação in-app. Aceitável em v1.0. |
| Aluno não tem `purchase` aprovada | Leitura de `user_progress` retorna 0 linhas; função retorna 400 com mensagem de progresso 0%. RLS de `purchases` não é consultada directamente nesta função. |
| Duas chamadas simultâneas do mesmo `(user_id, product_id)` | Constraint `UNIQUE(user_id, product_id)` rejeita o segundo INSERT com código `23505`; handler captura, relê linha vencedora, e devolve idempotente. |

### 6.3 Tratamento no ServiceLayer e hook

Erros propagam como exception (padrão FDD-003 §3.3). `useGenerateCertificate.onError` é tratado pelo `onError` global do QueryClient (toast genérico). Quando o erro é do tipo "progresso insuficiente" (mensagem inclui `Insufficient progress`), a página `Certificate.tsx` deve interceptar localmente e mostrar empty state em vez de toast destrutivo.

---

## 7. Restrições e Regras

1. A Edge Function nunca recalcula progresso a partir de `user_progress.completed`. Lê `progress_percentage` agregado e confia.
2. Bucket `certificates` é privado. Frontend nunca acede ao Storage directamente para certificados; sempre via signed URL gerada pelo ServiceLayer ou pela própria Edge Function.
3. TTL da signed URL: 300 s (5 minutos). Suficiente para download imediato; demasiado curto para partilha indevida. Conforme ADR-006.
4. PDF é gerado no Edge runtime, nunca no cliente. Cliente só consome bytes via signed URL.
5. `certificate_number` é gerado server-side com formato `CERT-YYYY-XXXXXX`. Cliente nunca propõe número.
6. Re-tentativa segura: chamada repetida nunca duplica linha em `certificates` nem dispara notificação em duplicado.
7. Notificação `send-notification` é best-effort: falha não interrompe geração.
8. ServiceLayer (`certificatesService`) é o único caminho do frontend para esta feature. Páginas não invocam directamente a Edge Function.
9. Service-role key é usada apenas no servidor (Edge Function); jamais exposta ao cliente.

---

## 8. Riscos

| ID | Risco | Probabilidade | Impacto | Mitigação | Plano de contingência |
|---|---|---|---|---|---|
| C1 | CPU limit do Supabase Free (50 ms) inviabiliza pdf-lib + upload (Risco 5 do HLD) | Alta | Alto | Validar plano Pro contratado antes de habilitar feature em produção; testes de carga em staging com plano equivalente | Desabilitar feature por flag; emissão manual via painel admin |
| C2 | Geração de PDF parcial deixa `pdf_url = NULL` permanentemente (linha existe sem ficheiro) | Média | Médio | Idempotência §3.5 caso 5b regenera PDF em retentativa do cliente | Job de reconciliação periódico que detecta linhas com `pdf_url = NULL` e re-invoca a função |
| C3 | Race condition entre duas chamadas simultâneas | Baixa | Baixo | `UNIQUE(user_id, product_id)` + tratamento de `23505` no handler | Não aplicável (constraint resolve) |
| C4 | PDF vaza por bucket público acidental | Baixa | Alto | Bucket configurado privado + RLS por prefixo `user_id` + signed URL TTL curto | Rotação de paths (move ficheiros) invalida signed URLs antigas |
| C5 | Truncamento de nomes longos no template (sem quebra de linha em v1.0) | Média | Baixo | Nomes acima de 60 caracteres truncados com `…`; comportamento documentado | Iteração v1.x: implementar quebra de linha automática em pdf-lib |
| C6 | `progress_percentage` em `user_progress` populado de forma inconsistente pelo Sistema de Progresso | Média | Alto | Contrato explícito no FDD-005; testes de integração que cubram fluxo conclusão → certificado | Validação adicional na Edge Function (recálculo) como flag de emergência, comprometendo §7.1 temporariamente |
| C7 | Render do PDF abre incorrectamente em pré-visualização do iOS (caracteres acentuados) | Baixa | Baixo | Helvetica StandardFonts cobre Latin-1; nomes em pt-PT/pt-BR são suportados | Embutir fonte custom (ex: Inter) se for detectado problema concreto |
| C8 | Colisão de `certificate_number` em escala alta (espaço de 10⁶ valores por ano; paradoxo de aniversário a partir de ~1000 emissões/ano) | Baixa em v1.0; cresce com adopção | Baixo | `crypto.getRandomValues` para distribuição uniforme + retry loop até `MAX_INSERT_ATTEMPTS = 5` em §5.2; isolamento de constraint violada | **Threshold de revisão:** ao atingir 5000 certificados emitidos por ano por instância, expandir formato para 8 caracteres alfanuméricos (`CERT-YYYY-XXXXXXXX`) reduzindo probabilidade de colisão por várias ordens de grandeza |

---

## 9. Plano de Migração

### 9.1 Pré-condições

- ✅ FDD-003 ServiceLayer aprovado
- ⏳ FDD-005 Sistema de Progresso aprovado antes ou em paralelo (este FDD assume contrato definido)
- ⏳ Plano Supabase Pro contratado em produção (Risco C1)

### 9.2 Sequência de PRs

**PR 1 — Storage bucket + RLS** *(sem código de aplicação)*
- Migration SQL: bucket `certificates`, policies de leitura por aluno e admin, escrita só service-role
- Sem impacto em código actual

**PR 2 — Edge Function reescrita**
- Substitui `supabase/functions/generate-certificate/index.ts`
- Inclui helpers `renderCertificatePdf`, `readAggregatedProgress`, `ensureCertificateRow`, `loadCertificateData`
- Mantém endpoint name (frontend não muda)
- Deploy via `supabase functions deploy generate-certificate`
- Validação manual: emitir certificado em staging para curso já concluído

**PR 3 — ServiceLayer + Hook**
- `src/services/certificates.service.ts` (já parcialmente no PR 5 do FDD-003; consolidar aqui o tipo `GenerateCertificateResponse`)
- `src/hooks/queries/useCertificates.ts`
- Sem alteração de UI ainda

**PR 4 — Página `student/Certificate.tsx`**
- Refactor para consumir `useGenerateCertificate` e `useCertificate`
- Estados de UI: empty, generating, available, error
- Interceptação de erro "progresso insuficiente" como empty state contextual
- Validação manual: fluxo end-to-end aluno conclui curso → gera → descarrega PDF

### 9.3 Validação

Teste manual em staging cobrindo:
- Curso 100% completo: gera certificado + PDF + abre download
- Curso 89%: rejeitado com mensagem
- Curso 90% no limite: aceito
- Geração repetida: devolve mesmo certificado, sem duplicar linha, sem nova notificação
- Linha existente com `pdf_url = NULL` (simulado): regenera PDF e popula campo
- PDF gerado abre correctamente em Chrome, Safari, Firefox e pré-visualização do iOS
- Aluno A não consegue baixar certificado de aluno B (signed URL bloqueada por prefix RLS no bucket)
- Admin do produto consegue listar certificados emitidos para o seu produto

---

## 10. Próximos Passos

1. Confirmar com Supabase plano Pro contratado antes de deploy em produção (C1)
2. Criar migration SQL do bucket `certificates` + policies
3. Implementar PR 2 (Edge Function) e validar em staging
4. Aguardar conclusão do FDD-005 (Sistema de Progresso) para confirmar contrato de leitura agregada de `user_progress`; substituir consolidação inline pela primitiva canónica quando disponível
5. Implementar PR 3 e PR 4
6. Adicionar fixtures de PDF gerado a uma suite de testes manuais para regressão visual

---

*FDD gerado após confirmação das decisões D1 (lib pdf-lib), D2 (template mínimo A4 landscape), D3 (caminho `{user_id}/{certificate_number}.pdf` no bucket `certificates`) e D4 (threshold 90%, leitura sem recálculo) com o user. Todas as decisões foram tomadas de forma colaborativa antes da redacção.*

*Correcção aplicada na revisão: `generateCertNumber` migrado de `Math.random()` 6 dígitos sem retry para `crypto.getRandomValues` 6 dígitos com loop de retry isolando colisão de número de race em `(user_id, product_id)` (§5.2). Risco C8 adicionado com threshold de 5000 emissões/ano para revisão de formato.*
