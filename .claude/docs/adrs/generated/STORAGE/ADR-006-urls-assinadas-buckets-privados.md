# ADR-006: URLs Assinadas para Conteúdo de Storage Privado

**Status:** Aceite
**Data:** 26-04-2026

**Depende de:**
- [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)
- [ADR-008: ServiceLayer obrigatorio entre paginas React e Supabase JS Client](../FRONTEND/ADR-008-service-layer-obrigatorio.md)

**ADRs Relacionadas:** [ADR-003: RLS como Mecanismo Unico de Autorizacao no DB](../AUTH/ADR-003-rls-como-mecanismo-unico-de-autorizacao.md)

---

## 1. Contexto e Problema

A plataforma APP XPRO armazena dois tipos de conteúdo binário sensível em Supabase Storage: PDFs anexados a módulos de cursos (bucket `module-content`) e PDFs de certificados de conclusão (bucket `certificates`). Ambos os recursos constituem produto vendido ou contêm dados pessoais identificáveis (nome completo do aluno nos certificados). Vídeos de módulos não usam Storage Supabase em v1.0: são YouTube embeds servidos pela própria YouTube via iframe, fora do âmbito desta decisão.

O risco de vazamento é concreto para os recursos sob gestão da plataforma: uma URL permanente e pública, se interceptada ou partilhada por um aluno, concede acesso irrestrito e indefinido ao PDF para qualquer pessoa, incluindo quem nunca realizou uma compra. PDFs de módulo são material vendido; certificados expõem PII do aluno (nome completo) sem o seu consentimento.

A decisão arquitetural é como controlar o acesso a estes recursos binários sem introduzir um proxy reverso ou backend dedicado para autorização de cada requisição, mantendo a arquitetura serverless e sem servidor próprio da plataforma.

## 2. Fatores de Decisão

- Prevenir acesso não autorizado a conteúdo pago (mitigação do Risco 8 do HLD: vazamento de URLs de Storage)
- Proteger PII do aluno (nome completo) presente nos PDFs de certificado
- Manter compatibilidade com arquitetura serverless sem backend próprio
- Minimizar overhead por requisição sem comprometer segurança
- Garantir que o ServiceLayer seja o único ponto de geração de URLs (sem acesso direto ao Storage nas páginas)

## 3. Opções Consideradas

- **Opção A**: URLs assinadas com TTL diferenciado por tipo de recurso via `storage.createSignedUrl`
- **Opção B**: Tokens JWT customizados validados em Edge Function antes de servir o recurso
- **Opção C**: Bucket público com caminho ofuscado por hash aleatório

## 4. Resultado da Decisão

Opção escolhida: **Opção A — URLs assinadas com TTL diferenciado**, porque a primitiva `storage.createSignedUrl` do Supabase resolve nativamente o problema de acesso temporário sem exigir proxy, valida o JWT do utilizador na geração e garante expiração automática sem gestão de estado adicional.

Os TTLs canónicos definidos são 3600 s (1 hora) para PDFs de módulo e 300 s (5 minutos) para certificados. O TTL de certificados é intencionalmente curto por ser suficiente para download imediato e por conter PII. O TanStack Query nas queries de URL tem `staleTime: 0`, impedindo que o frontend cache URLs permanentemente.

## 5. Prós e Contras das Opções

### Opção A: URLs assinadas via `storage.createSignedUrl`

- Positivo: Expiração automática; partilha indevida tem janela limitada ao TTL
- Positivo: Primitiva nativa do SDK Supabase; sem código adicional de autorização
- Positivo: Sem overhead de proxy; o Storage serve o recurso diretamente após validação da assinatura
- Negativo: URL precisa ser regerada a cada uso; `staleTime: 0` aumenta chamadas ao Storage

### Opção B: Tokens JWT customizados validados em Edge Function

- Positivo: Controlo total sobre o ciclo de vida do token e regras de acesso granulares
- Negativo: Reinventa o que `createSignedUrl` já oferece nativamente, com mais latência
- Negativo: Exige Edge Function como proxy para cada requisição de conteúdo; custo operacional elevado

### Opção C: Bucket público com caminho ofuscado por hash

- Positivo: Sem overhead de geração de URL; simplicidade de implementação
- Negativo: Segurança por obscuridade: qualquer vazamento de URL compromete o acesso de forma permanente e irrevogável
- Negativo: Não há mecanismo de revogação; impossível invalidar acesso sem mover o ficheiro

## 6. Consequências

Buckets `module-content` e `certificates` são configurados como privados no Supabase Storage. Buckets de conteúdo não sensível (`product-images`, `avatars`, `logos`) permanecem públicos por não conterem produto pago nem PII. Esta distinção é a fronteira operacional entre buckets públicos e privados na plataforma.

O ServiceLayer (`src/services/storage.service.ts`) é o único ponto autorizado de invocação de `createSignedUrl`. Páginas e hooks React nunca acedem ao Storage diretamente; consomem URLs já assinadas através dos serviços de domínio (`modules.service.ts`, `certificates.service.ts`). Esta restrição é aplicada por convenção arquitetural documentada no FDD-003.

Em caso de incidente de vazamento de URL, o procedimento canónico de invalidação emergencial vive no runbook operacional (a produzir na fase Runbooks): mover o ficheiro de `<bucket>/<path>` para `<bucket>/quarantine/<timestamp>-<path>` invalida todas as URLs antigas instantaneamente; reupload do ficheiro com novo path; comunicação ao utilizador afectado por e-mail via Resend.

Critério de volume para migração para CDN externa: > 500 GB/mês de transferência em PDFs e imagens de produto (alinhado com o critério de revisão do ADR-001). Vídeos não fazem parte deste cálculo, são YouTube embeds e ficam fora do orçamento de Storage Supabase. Avaliação inclui Cloudflare R2 (egress free), Bunny.net (€0.01/GB) e AWS S3 + CloudFront.

## 7. Referências

- `.claude/docs/HLD.md` — Risco 8 (vazamento de URLs de Storage) e ADR-006 original com TTLs canónicos
- `.claude/docs/FDD-service-layer.md` — ServiceLayer como único ponto de acesso ao Storage; restrição documentada na seção de regras
- `.claude/docs/FDD-geracao-certificado.md` — Uso de signed URL com TTL 300 s no retorno da Edge Function `generate-certificate`
- `src/services/storage.service.ts:1` — Implementação centralizada de `getSignedUrl` (a criar via FDD-003)
- `supabase/functions/generate-certificate/index.ts:1` — Geração e retorno de signed URL no contexto de Edge Function
