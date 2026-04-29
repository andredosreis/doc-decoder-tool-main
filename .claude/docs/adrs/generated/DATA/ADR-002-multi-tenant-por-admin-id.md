# ADR-002: Multi-tenant por admin_id em vez de tabela organizations

**Status:** Aceito
**Data:** 26-04-2026

**Depende de:**
- [ADR-001: Adoção do Supabase como BaaS Único em v1.0](../CORE/ADR-001-supabase-como-baas-unico.md)
- [ADR-003: RLS como Mecanismo Unico de Autorizacao no DB](../AUTH/ADR-003-rls-como-mecanismo-unico-de-autorizacao.md)

**ADRs Relacionadas:**
- [ADR-012: Adotar supabase/migrations versionado como fonte de verdade do schema](../SCHEMA/ADR-012-supabase-migrations-versionadas.md)

---

## 1. Contexto e Declaração do Problema

O APP XPRO é uma plataforma SaaS onde cada criador de conteúdo (admin) opera de forma independente: publica produtos, gerencia alunos e configura integrações de pagamento sem interação com outros admins. A v1.0 estabeleceu o modelo de dados base da plataforma e foi necessário definir como implementar o isolamento entre esses criadores.

O modelo tradicional de SaaS multi-tenant usa uma tabela `organizations` com membros via relação N:M, permitindo que múltiplos usuários compartilhem os mesmos recursos. A questão foi: esse nível de complexidade é necessário para o caso de uso primário do APP XPRO, onde o cenário esperado é "1 admin = 1 negócio próprio"?

A decisão impacta toda a camada de dados: como produtos, módulos, compras e certificados se relacionam entre si e como as políticas de RLS são escritas para garantir o isolamento (Risco 4 do HLD).

Não há requisito de negócio identificado para multi-admin antes do lançamento. v1.0 foca exclusivamente em criadores solo. Multi-admin fica registado como dívida activável por demanda concreta.

## 2. Drivers de Decisão

- Velocidade de go-live: reduzir escopo de schema e complexidade de queries na v1.0 para viabilizar entrega
- Isolamento garantido: RLS deve impedir cross-tenant data leak (Risco 4 do HLD) sem ambiguidade
- Caso de uso primário: criadores independentes que vendem seus próprios cursos, sem colaboração entre admins
- Manutenibilidade: políticas RLS simples reduzem superfície de erro e facilitam auditoria
- Ausência de demanda imediata para colaboração multi-admin no mercado-alvo inicial

## 3. Opções Consideradas

- **Opção A:** Multi-tenant por `admin_id` direto em `products` (sem tabela `organizations`)
- **Opção B:** Tabela `organizations` com membership N:M desde v1.0
- **Opção C:** Tenant por `admin_id` em v1.0 com coluna `organization_id` nullable como preparação para migração futura

## 4. Resultado da Decisão

Opção escolhida: **Opção A** — multi-tenant por `admin_id` direto em `products`, pois elimina joins e entidades adicionais desnecessárias para o caso de uso dominante em v1.0. O modelo é conceitualmente direto: admin = tenant. O ownership se propaga por cadeia de chaves estrangeiras (products -> modules -> purchases -> certificates), e as políticas RLS ficam reduzidas a `auth.uid() = admin_id` nas queries de produtos.

A Opção B foi rejeitada por introduzir complexidade arquitetural sem ROI imediato: membership N:M exigiria três tabelas adicionais, reescrita de todas as políticas RLS e aumento de joins em cada query do admin. A Opção C foi descartada por criar uma abstração prematura que não resolve o problema antes que ele exista — colunas anuláveis introduzem ambiguidade nas policies sem benefício concreto.

Threshold de activação para migração: ≥ 3 pedidos formais de colaboração entre admins via canal de support **OU** > 50 admins activos com tickets de support pedindo multi-admin. Quando atingido, ADR sucessor formaliza a migração para modelo com tabela `organizations`.

## 5. Prós e Contras das Opções

### Opção A: admin_id direto em products

- Positivo: RLS trivial (`auth.uid() = admin_id`); sem joins adicionais em queries de admin
- Positivo: Schema enxuto; menos entidades para auditar e testar
- Positivo: Adequado ao perfil de criador solo que representa 100% dos usuários esperados em v1.0
- Negativo: Não suporta equipes com múltiplos admins compartilhando produtos
- Negativo: Transferência de produto entre admins exige UPDATE manual em `admin_id`

### Opção B: organizations com membership N:M

- Positivo: Suporta equipes de instrutores desde o início; elimina necessidade de refactor futuro
- Negativo: Complexidade desproporcional ao caso de uso de v1.0; atrasa go-live
- Negativo: Políticas RLS mais complexas aumentam superfície de erro e risco de cross-tenant leak

### Opção C: admin_id com organization_id nullable

- Positivo: Prepara schema para migração sem reescrita total
- Negativo: Ambiguidade nas policies RLS (qual coluna usar quando ambas estão preenchidas?)
- Negativo: Abstração prematura sem caso de uso concreto que a justifique

## 6. Consequências

A cadeia de ownership pelo `admin_id` torna-se o eixo central do modelo de dados: módulos pertencem a produtos, compras referenciam produtos, certificados derivam de produtos. Toda a cadeia herda indiretamente o isolamento por admin sem que cada entidade precise de coluna própria de ownership. Isso simplifica queries e torna as políticas RLS auditáveis em minutos.

A principal consequência negativa registrada é a limitação para cenários de colaboração: um admin não pode coloborar com outro no mesmo produto sem compartilhar credenciais. Quando esse caso de uso se tornar relevante, a migração exigirá nova tabela `organizations`, nova tabela `organization_members`, substituição de `admin_id` por `organization_id` em `products`, e reescrita de todas as políticas RLS afetadas. A migração é viável mas não trivial, especialmente com dados em produção.

Comunicação da limitação: secção "Limitações conhecidas" no FAQ público + texto explicativo no signup ("Para colaboração entre instrutores, aguardar v2 ou contactar support"). O texto exacto é definido em conjunto com a landing page (fora do âmbito v1.0 actual).

## 7. Referências

- `EXECUTAR_NO_SUPABASE.sql:120` — DDL de products com coluna admin_id e políticas RLS associadas
- `src/integrations/supabase/types.ts:1` — Tipos gerados do schema; reflete estrutura de ownership
- `src/services/products.service.ts:1` — Camada de serviço de produtos; queries filtradas por admin_id
- `.claude/docs/HLD.md` — Seção "Modelo de dados" e Risco 4 (cross-tenant data leak por RLS mal configurada)
