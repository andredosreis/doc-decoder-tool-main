# ADR-012: Adotar supabase/migrations versionado como fonte de verdade do schema

**Status:** Aceite
**Data:** 26-04-2026

**Depende de:** [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)

**ADRs Relacionadas:**
- [ADR-002: Multi-tenant por admin_id em vez de tabela organizations](../DATA/ADR-002-multi-tenant-por-admin-id.md)
- [ADR-003: RLS como Mecanismo Unico de Autorizacao no DB](../AUTH/ADR-003-rls-como-mecanismo-unico-de-autorizacao.md)
- [ADR-005: Idempotência de Webhook por UNIQUE(external_transaction_id)](../BILLING/ADR-005-idempotencia-webhook-unique-constraint.md)

---

## 1. Contexto e Problema

O schema da base de dados da plataforma APP XPRO foi, desde o inicio, mantido num unico script SQL (`EXECUTAR_NO_SUPABASE.sql`) que executa `DROP TABLE IF EXISTS` seguido de `CREATE TABLE` para cada tabela. Qualquer alteracao de schema exige editar este ficheiro e re-executa-lo integralmente, o que em ambientes de producao implica destruir e recriar as tabelas - operacao irreversivel sem backup previo.

A ausencia de migrations versionadas cria tres problemas operacionais directos: impossibilidade de rollback estruturado apos uma alteracao problematica, ausencia de registo auditavel de quem aplicou o que e quando, e bloqueio ao deployment incremental necessario num contexto de CI/CD. O HLD (versao 1.0, 26-04-2026) regista explicitamente esta situacao como divida tecnica de prioridade alta sob o codigo ADR-012, com obrigacao de resolver antes do primeiro utilizador real.

A alternativa nativa do Supabase CLI - directorio `supabase/migrations/` com ficheiros timestampados - representa o padrao estabelecido no ecossistema (equivalente ao que Rails, Django e Prisma fazem nas suas respectivas stacks), oferecendo deployment incremental, diff automatico entre ambientes e rastreabilidade completa de evolucao do schema.

## 2. Factores de Decisao

- Deployment seguro em producao e bloqueador de go-live: alteracoes sem migrations expoem risco de perda de dados irrecuperavel.
- Rastreabilidade de auditoria: cada alteracao de schema deve produzir um artefacto versionado com autoria e timestamp.
- Rollback estruturado: incidentes causados por alteracoes de schema precisam de reversao controlada, nao de restauracao total de backup.
- Integracao nativa com Supabase CLI: o tooling oficial suporta `supabase db diff`, `supabase db push` e `supabase migration new` sem camadas adicionais.
- Habilitacao de CI/CD com schema diff automatizado e ambientes dev/staging/producao independentes.

## 3. Opcoes Consideradas

- **Opcao A - Migrations versionadas em `supabase/migrations/` (Supabase CLI nativo)**
- **Opcao B - Manter script unico `EXECUTAR_NO_SUPABASE.sql`**
- **Opcao C - Prisma Migrate como camada de migrations desacoplada do Supabase**

## 4. Resultado da Decisao

Opcao A escolhida porque elimina o risco operacional critico de deployment destrutivo em producao e e a abordagem nativa do Supabase CLI, sem adicionar dependencias externas. O HLD posiciona esta decisao como pre-requisito de go-live e nao como melhoria opcional.

[NECESSITA INPUT: Qual e a politica de naming de migrations adoptada - timestamp puro `YYYYMMDDHHMMSS_descricao` vs sequencial `0001_descricao`? Esta escolha afecta todas as tooling integrations e deve ficar registada antes de criar a migration baseline.]

## 5. Pros e Contras das Opcoes

### Opcao A - Migrations versionadas em `supabase/migrations/`

- Positivo: deployment incremental e seguro; cada migration aplica apenas o delta, nunca destroi dados existentes.
- Positivo: rollback por reversao da migration especifica sem restaurar backup completo.
- Positivo: integracao directa com `supabase db diff` para gerar migrations a partir de alteracoes no schema local.
- Negativo: disciplina continua exigida - cada alteracao de schema deve produzir nova migration; sem automacao de enforcement no pipeline actual.

### Opcao B - Manter script unico `EXECUTAR_NO_SUPABASE.sql`

- Positivo: zero overhead operacional para alteracoes em ambiente de desenvolvimento isolado.
- Negativo: qualquer aplicacao em producao implica DROP + CREATE, com risco directo de perda de dados.
- Negativo: sem rastreabilidade nem rollback; incompativel com operacao em producao com utilizadores reais.

### Opcao C - Prisma Migrate desacoplado

- Positivo: experiencia de DX familiar para equipas com background Node.js/TypeScript.
- Negativo: adiciona uma camada de mapeamento sobre o schema PostgreSQL nativo, perdendo a integracao directa Supabase CLI.
- Negativo: features especificas do Supabase (RLS policies, funcoes SQL, triggers) nao sao geridas nativamente pelo Prisma Migrate, criando surface de schema nao coberta pelas migrations.

## 6. Consequencias

A adopcao de migrations versionadas requer uma migration "baseline" inicial que capture o estado actual do schema (`EXECUTAR_NO_SUPABASE.sql`) como ponto de partida. Esta migration de arranque pode ser gerada via `supabase db diff` a partir de um ambiente com o schema actual aplicado, ou construida manualmente como exportacao do schema existente. Apos o baseline, o ficheiro `EXECUTAR_NO_SUPABASE.sql` passa a ser exclusivamente para provisionamento de ambientes de desenvolvimento do zero (sem dados), documentando que a fonte de verdade para alteracoes incrementais e `supabase/migrations/`.

O pipeline de CI/CD deve incorporar validacao de migrations antes de qualquer deployment para producao. A operacao continua exige que qualquer alteracao de schema - incluindo RLS policies, funcoes SQL e triggers - produza uma nova migration em vez de editar o script unico. Migrations destrutivas (DROP COLUMN, RENAME) requerem politica de overlap explicitamente documentada para garantir janelas de compatibilidade.

[NECESSITA INPUT: Qual e a estrategia definida para migrations destrutivas - periodo de overlap obrigatorio, colunas temporarias paralelas, ou apenas janela de manutencao comunicada? Esta politica deve ficar registada antes do primeiro utilizador real para orientar futuras alteracoes de schema.]

## 7. Referencias

- `EXECUTAR_NO_SUPABASE.sql:1` (script unico actual; fonte de verdade pre-decisao)
- `supabase/config.toml:1` (configuracao do Supabase CLI; habilita comandos de migration)
- `.claude/docs/HLD.md` (seccao "Dividas tecnicas registadas" e "ADRs associados: ADR-012")
