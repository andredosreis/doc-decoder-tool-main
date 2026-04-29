# Potential ADR: Adoptar supabase/migrations versionado como fonte de verdade do schema

**Module:** SCHEMA
**Category:** Operations
**Priority:** must-document
**Score:** 105/150

---

## What Was Identified

Estado actual: schema da base de dados é mantido num script SQL único (`EXECUTAR_NO_SUPABASE.sql`) executado completamente em cada ambiente do zero (DROP TABLE IF EXISTS + CREATE TABLE). Não há versionamento por migration; cada alteração é editada no ficheiro e re-executada.

Estado alvo: migrations versionadas em `supabase/migrations/` (estrutura nativa Supabase CLI), com timestamp como nome (`YYYYMMDDHHMMSS_descrição.sql`). Cada alteração de schema produz nova migration; rollback é possível por reversão da migration específica.

Introduced: 2026-04-26 (HLD baseline; transição planeada como dívida operacional)

## Why This Might Deserve an ADR

**Impact:** Capacidade de deployment seguro em produção. Hoje, qualquer mudança de schema implica risco de DROP + CREATE em produção.

**Trade-offs:** Rastreabilidade + rollback parcial + deployment incremental + diff automático no CI vs disciplina contínua de criar migrations a cada mudança; CLI Supabase exigida no pipeline.

**Complexity:** Média na migração inicial (gerar migration "baseline" a partir do schema actual); baixa em operação contínua.

**Team Knowledge:** Padrão conhecido (Rails, Django, Prisma migrations).

**Future Implications:** Habilita CI/CD com schema diff automation, ambiente dev separado de produção, restore parcial em incidente.

## Evidence Found in Codebase

**Key Files:**
- EXECUTAR_NO_SUPABASE.sql:1 (script único actual)
- supabase/migrations/ (a criar; vazio actualmente)
- supabase/config.toml:1 (configuração do CLI)

**Impact Analysis:**
Sem migrations versionadas, qualquer alteração em produção requer aplicar SQL via SQL Editor do Supabase Dashboard manualmente. Sem trail de auditoria de quem aplicou o quê quando. Sem rollback estruturado. Introduced: 2026-04-26 como dívida explícita registada no HLD.

**Alternative Not Chosen:**
Manter script único `EXECUTAR_NO_SUPABASE.sql` indefinidamente. Rejeitada por impossibilitar rollback parcial e deployment seguro; volátil em equipa que cresce. Considerou-se também Prisma migrations (decoupled do Supabase); rejeitada por adicionar uma camada extra de mapeamento sobre o schema, e perder a integração nativa Supabase CLI.

## Questions to Address in ADR

- Migração inicial: como gerar migration "baseline" a partir do schema actual (`supabase db diff` ou export manual)?
- Política de naming: timestamp puro (`20260428120000_add_certificates`) vs híbrido (`0001_initial`)?
- Estratégia de migrations destrutivas (DROP COLUMN, RENAME) — política de aviso e período de overlap?

## Additional Notes

ADR-012 do HLD posiciona esta migração como dívida com prioridade alta. Aplicar antes de aceitar primeiros utilizadores reais; após go-live, alterações de schema sem migration violam o pacto.
