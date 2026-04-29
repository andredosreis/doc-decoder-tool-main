# Potential ADR: URLs assinadas para conteúdo de Storage privado

**Module:** STORAGE
**Category:** Security
**Priority:** must-document
**Score:** 125/150

---

## What Was Identified

Conteúdo binário de buckets privados (vídeos em `module-content`, certificados PDF em `certificates`) é servido exclusivamente via `storage.createSignedUrl(path, expiresIn)`. URLs públicas permanentes proibidas para estes recursos. TTL diferenciado por tipo: 3600 s (1 hora) para vídeos, 300 s (5 minutos) para certificados.

ServiceLayer encapsula a geração de URLs (`storage.service.ts.getSignedUrl`); páginas e hooks nunca acedem `supabase.storage` directamente. Cliente nunca cacheia URL permanentemente; queries de URL têm `staleTime: 0` no TanStack Query.

Buckets `product-images`, `avatars` e `logos` são públicos (conteúdo não sensível). Bucket `module-content` e `certificates` são privados.

Introduced: 2026-04-26 (HLD baseline; FDD-003 e FDD-004 formalizam uso)

## Why This Might Deserve an ADR

**Impact:** Anti-leakage de conteúdo pago. Vídeos e certificados são produto vendido e contêm PII (nome do aluno).

**Trade-offs:** Segurança forte (URL expira; partilha tem janela curta) vs URL precisa ser regenerada em cada uso; cliente nunca cacheia URL permanentemente; pequeno overhead de chamada para gerar URL.

**Complexity:** Baixa. SDK do Supabase já expõe a primitiva.

**Team Knowledge:** Familiar.

**Future Implications:** CDN externa para vídeos (quando Storage Supabase atingir limite) exige integração diferente — Cloudflare R2, Bunny.net e AWS S3+CloudFront são candidatos pendentes em decisão futura.

## Evidence Found in Codebase

**Key Files:**
- src/services/storage.service.ts:1 (a criar via FDD-003)
- src/services/modules.service.ts:1 (getVideoSignedUrl, getPdfSignedUrl)
- src/services/certificates.service.ts:1 (getDownloadUrl)
- supabase/functions/generate-certificate/index.ts:1 (signed URL no retorno)
- .claude/docs/FDD-service-layer.md:1

**Impact Analysis:**
Risco 8 do HLD ("Vazamento de URLs de Storage públicas para vídeos") tem probabilidade média e impacto alto: vídeos vendidos podem ser partilhados a quem nunca pagou. Decisão de signed URL é a principal mitigação. Introduced: 2026-04-26.

**Alternative Not Chosen:**
Tokens JWT custom para autorizar acesso a Storage (validação na Edge Function antes de servir). Rejeitada por reinventar o que `createSignedUrl` já faz nativamente; aumenta latência. Considerou-se também bucket público com URL ofuscada (caminho com hash); rejeitada por ser segurança por obscuridade — qualquer fuga compromete tudo permanentemente.

## Questions to Address in ADR

- Critério para migração para CDN externa? (ex: > X TB/mês no Storage Supabase)
- Como invalidar signed URL em incidente activo (mover ficheiro para novo path invalida URLs antigas)?
- TTL óptimo para vídeos longos (>1 h) que excedem 3600 s? Refresh transparente do hook?

## Additional Notes

ADR-006 do HLD lista "TTL 3600 s para vídeos; TTL 300 s para certificados" como configuração canónica. FDD-004 (Geração de Certificado) e FDD-003 (ServiceLayer) consomem esta decisão.
