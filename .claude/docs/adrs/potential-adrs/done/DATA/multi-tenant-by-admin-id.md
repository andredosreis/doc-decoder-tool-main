# Potential ADR: Multi-tenant por admin_id em vez de tabela organizations

**Module:** DATA
**Category:** Data Model
**Priority:** must-document
**Score:** 130/150

---

## What Was Identified

Não existe tabela `organizations` ou `tenants` no schema. Cada admin possui directamente os seus produtos via coluna `products.admin_id` (FK para `profiles.id`). Isolamento entre admins é garantido por RLS policies que comparam `auth.uid() = admin_id` em queries de `products`. Modelo conceptualmente simples: admin = tenant; um admin = um negócio.

Aluno não pertence a nenhum tenant; tem acesso a produtos via `purchases` aprovadas, independentemente de quem é o admin do produto.

Introduced: 2026-04-26 (HLD baseline; schema inicial)

## Why This Might Deserve an ADR

**Impact:** Modelo de dados de toda a plataforma; condiciona como produtos, módulos, alunos e compras se relacionam.

**Trade-offs:** Simplicidade (menos joins, menos foreign keys, RLS trivial) vs incapacidade de equipas com múltiplos admins partilhando os mesmos produtos; impossibilidade de "transferir" produto entre admins sem UPDATE manual em `admin_id`.

**Complexity:** RLS por `admin_id` é trivial; performance esperada estável com índice em `products.admin_id`.

**Team Knowledge:** Padrão conhecido em SaaS pequeno-médio.

**Future Implications:** Multi-admin teams (ex: agência com vários instrutores criando juntos) exige refactor com tabela `organizations` + `organization_members` (N:M). Migração futura é viável mas não trivial.

## Evidence Found in Codebase

**Key Files:**
- EXECUTAR_NO_SUPABASE.sql:120 (DDL de products + RLS)
- src/types/domain.ts:1 (Product type derivado)
- src/pages/admin/Products.tsx:1
- src/services/products.service.ts:1

**Impact Analysis:**
Aplicado consistentemente: products, modules (via FK em product_id), purchases, certificates herdam o ownership por cadeia. RLS evita cross-tenant leak (Risco 4 do HLD) desde que policies sejam todas escritas correctamente. Introduced: 2026-04-26.

**Alternative Not Chosen:**
Tabela `organizations` com membership N:M (`organizations`, `organization_members`, `products.organization_id`). Cobriria multi-admin teams. Rejeitada para v1.0 por overkill: o use case primário é "1 admin = 1 negócio próprio". Adicionar a complexidade na fase inicial atrasaria go-live sem ROI imediato.

## Questions to Address in ADR

- Quando migrar para `organizations`? Threshold de adopção? (ex: > 50 admins, > 5 pedidos de "equipa")
- Como comunicar a limitação a admins iniciais que possam querer colaborar?
- Suporte temporário a co-admin via duplicação de dados?

## Additional Notes

Entidades fora de escopo v1.0 (registadas para futuro): `coupons`, `quiz_questions`, `quiz_answers`, `admin_settings`. Modelo de tenant pode ser revisitado em conjunto com estas adições.
