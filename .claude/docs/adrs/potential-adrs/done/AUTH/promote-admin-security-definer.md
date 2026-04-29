# Potential ADR: Promoção de role admin via SQL SECURITY DEFINER + Edge Function

**Module:** AUTH
**Category:** Security
**Priority:** must-document
**Score:** 135/150

---

## What Was Identified

Promoção de utilizador para role 'admin' substitui o anterior UPDATE client-side em `user_roles` que abre privilege escalation (Risco 2 do HLD; estado actual em produção). Implementação alvo:

- Função SQL `promote_to_admin(target_user_id) SECURITY DEFINER` valida `has_role(auth.uid(), 'admin')` antes do UPDATE em `user_roles`. Apenas admin existente pode promover outro user.
- Edge Function `promote-admin` cobre exclusivamente o signup inicial (primeiro admin da plataforma, sem admin pré-existente para autorizar) usando token especial configurado em variável de ambiente.
- Política RLS em `user_roles` bloqueia UPDATE pelo próprio utilizador (regra defensiva).

Introduced: 2026-04-26 (FDD-001 Promoção de Admin formaliza)

## Why This Might Deserve an ADR

**Impact:** Bloqueador de go-live. Vulnerabilidade activa hoje permite que qualquer aluno se torne admin se o gap em RLS for explorado.

**Trade-offs:** Segurança forte (validação SQL atómica + função privilegiada controlada) + padrão reutilizável para futuras mudanças de role vs cerimónia adicional vs token especial precisa de rotação em incidente.

**Complexity:** Média. SECURITY DEFINER exige cuidado para evitar SQL injection via parâmetros não validados. Edge Function de bootstrap com token tem manipulação de secrets.

**Team Knowledge:** SECURITY DEFINER é avançado mas necessário; team já familiarizado via interview.

**Future Implications:** Padrão estabelecido para todas as mudanças de role futuras (ex: 'super_admin' se introduzido). Modelo replicável em outras escritas privilegiadas.

## Evidence Found in Codebase

**Key Files:**
- src/pages/Signup.tsx:1 (UPDATE directo a remover)
- supabase/functions/promote-admin/index.ts:1 (a criar)
- EXECUTAR_NO_SUPABASE.sql:1 (function `promote_to_admin` + RLS bloqueando UPDATE)
- .claude/docs/FDD-promocao-admin.md:1

**Impact Analysis:**
Risco 2 listado como "bloqueador de go-live" no HLD. Mitigação obrigatória antes de aceitar primeiros utilizadores reais. Introduced: 2026-04-26 (FDD aprovado).

**Alternative Not Chosen:**
Manter UPDATE client-side com mais checks aplicacionais. Rejeitada por estar fundamentalmente vulnerável: qualquer cliente pode bypassar checks JS. Considerou-se também bloquear UPDATE em `user_roles` via RLS estrita e exigir uso exclusivo de Edge Function para todas as promoções; rejeitada por adicionar latência a operações que admin usa internamente; SQL function com SECURITY DEFINER é o melhor compromisso.

## Questions to Address in ADR

- Política de rotação do token de signup inicial (após primeira promoção, deve ser invalidado?)
- Auditoria de chamadas à função `promote_to_admin` (log estruturado?)
- Como prevenir self-promotion num race condition?

## Additional Notes

FDD-001 (`FDD-promocao-admin.md`) tem detalhes completos: fluxos bootstrap, create_invite, use_invite; tabela `admin_invites`; integração hCaptcha; RLS bloqueando UPDATE. ADR consolida apenas a decisão arquitectural, não o detalhe.
