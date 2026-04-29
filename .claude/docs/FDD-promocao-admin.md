### FDD: Promoção de Admin

Versão: 1.0
Data: 2026-04-26
Responsável: André dos Reis

---

### 1. Contexto e motivação técnica

O fluxo actual de registo em `Signup.tsx` executa um UPDATE directo em `user_roles` para promover qualquer utilizador recém-criado a `admin`, sem nenhuma validação server-side. Isto significa que qualquer pessoa que aceda `/auth/signup` pode tornar-se admin, incluindo bots que criem contas em massa, saturando o banco de dados e obtendo acesso a dados de todos os criadores da plataforma.

Este FDD encerra o registo público livre e substitui-o por dois mecanismos seguros:

1. **Bootstrap do primeiro admin** via token de ambiente (`ADMIN_BOOTSTRAP_TOKEN`), executado uma única vez durante o setup inicial da plataforma.
2. **Sistema de convite por token** para todos os admins subsequentes: um admin existente gera um convite, o convidado usa o link para criar a conta e a Edge Function valida o token antes de promover.

O `/auth/signup` público é desactivado após o bootstrap. Encaixa no HLD como resolução do Risco 2 (bloqueador de go-live) e implementa o ADR-004.

**Atores:**
- Super admin (primeiro admin criado via bootstrap)
- Admin existente (gera convites para novos admins)
- Novo admin (usa link de convite para criar conta)
- Edge Function `promote-admin` (valida tokens, executa promoção via Service Role Key)
- Função SQL `promote_to_admin` SECURITY DEFINER (reservada para chamadas autenticadas futuras por admin existente via RPC)

**Limites do escopo:**
- Esta feature trata apenas de admins. Onboarding de alunos continua via `admin-invite-student` (fluxo separado, não alterado).

---

### 2. Objetivos técnicos

- Nenhum utilizador pode promover-se a admin via chamada directa ao cliente Supabase; toda promoção passa por validação server-side com probabilidade de bypass de 0% se RLS e Edge Function estiverem correctos.
- O bootstrap do primeiro admin executa exactamente uma vez; token de bootstrap fica inválido após o primeiro uso.
- Token de convite tem TTL de 48h, é de uso único e pode ser restringido a um e-mail específico; expirado ou usado retorna 400 sem promoção.
- Rate limit de geração de convites de 5 por admin por dia para mitigar abuso interno.
- A política RLS em `user_roles` bloqueia UPDATE pelo próprio utilizador, tornando o ataque client-side impossível mesmo que o SDK seja chamado directamente.
- `/auth/signup` retorna 403 sem token de convite válido após o bootstrap.

---

### 3. Escopo e exclusões

**Incluído**
- Tabela `admin_invites` (schema definido na secção 8)
- Tabela `system_config` (schema definido na secção 8)
- Edge Function `promote-admin` com três modos: bootstrap, create_invite e use_invite
- Função SQL `promote_to_admin(target_user_id uuid)` SECURITY DEFINER (para uso futuro por admin autenticado via RPC; promoção pela Edge Function usa UPDATE directo com Service Role Key)
- Política RLS em `user_roles` bloqueando UPDATE pelo próprio utilizador
- Políticas RLS em `admin_invites` (definidas na secção 8)
- Remoção do UPDATE directo em `user_roles` do `Signup.tsx`
- Modificação de `/auth/signup` para exigir `invite_token` via query param
- UI no painel admin para gerar e listar convites activos
- Rate limit de 5 convites por admin por dia via tabela `admin_invites`
- CAPTCHA (hCaptcha) no formulário de signup para mitigar bots

**Excluído**
- Aprovação manual de contas pendentes (role `pending` não é implementado)
- Convite de alunos (fluxo separado via `admin-invite-student`)
- 2FA (fora de escopo v1.0 conforme HLD)
- Revogação de convites via UI (apenas via expiração automática em v1.0)
- Social login (Google, GitHub) como método de registo de admin

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal A: Bootstrap do primeiro admin**

1. Operador define `ADMIN_BOOTSTRAP_TOKEN` no ambiente Supabase Edge (secret).
2. Operador acede `/auth/signup?bootstrap_token=<valor>` ou executa script CLI de setup.
3. Frontend envia POST para Edge Function `promote-admin` com `{ mode: "bootstrap", bootstrap_token, email, password, full_name }`.
4. Edge Function valida `bootstrap_token` contra `ADMIN_BOOTSTRAP_TOKEN` do ambiente usando comparação de tempo constante (`timingSafeEqual`).
5. Edge Function verifica que não existe nenhum registo com `role = 'admin'` em `user_roles`; se existir, retorna 409 (bootstrap já executado).
6. Edge Function chama `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`.
7. Trigger `handle_new_user` cria `profiles` e insere `user_roles` com `role = 'user'` por defeito.
8. Edge Function executa `UPDATE user_roles SET role = 'admin' WHERE user_id = <novo_id>` usando Service Role Key (bypass de RLS).
9. Edge Function regista flag de bootstrap concluído: `INSERT INTO system_config(key, value) VALUES ('bootstrap_done', 'true') ON CONFLICT (key) DO NOTHING`.
10. Retorna 201 com `{ user_id, email, role: "admin" }`.

**Fluxo principal B: Convite de novo admin por admin existente**

1. Admin autenticado acede ao painel e clica em "Convidar Admin".
2. AdminApp chama `ServiceLayer.adminInvites.create({ email?: string })`.
3. ServiceLayer invoca Edge Function `promote-admin` com `{ mode: "create_invite", email }` e JWT do admin.
4. Edge Function valida JWT; verifica `has_role(auth.uid(), 'admin')`; se não for admin, retorna 403.
5. Edge Function verifica rate limit: conta registos em `admin_invites` criados pelo `invited_by = auth.uid()` nas últimas 24h; se >= 5, retorna 429.
6. Edge Function gera token criptograficamente seguro (`crypto.randomUUID()` + sufixo aleatório de 16 bytes em hex).
7. Edge Function insere em `admin_invites`: `{ token, invited_by, email, used: false, expires_at: now() + 48h }` via Service Role Key.
8. Retorna 201 com `{ invite_url: "https://app.appxpro.online/auth/signup?invite_token=<token>", expires_at }`.
9. Admin copia e envia o link manualmente (v1.0 sem envio automático de e-mail para convite de admin).

**Fluxo principal C: Novo admin usa convite**

1. Novo admin acede `/auth/signup?invite_token=<token>`.
2. Frontend exibe formulário de signup (nome, e-mail, senha) + CAPTCHA hCaptcha.
3. Utilizador preenche e submete; frontend valida CAPTCHA client-side antes de enviar.
4. Frontend envia POST para Edge Function `promote-admin` com `{ mode: "use_invite", invite_token, email, password, full_name, hcaptcha_token }`.
5. Edge Function valida CAPTCHA via API hCaptcha (`POST https://hcaptcha.com/siteverify`); se inválido, retorna 400.
6. Edge Function busca registo em `admin_invites WHERE token = <invite_token> AND used = false AND expires_at > now()`; se não encontrar, retorna 400 com `{ error: "token_invalid_or_expired" }`.
7. Se `email` foi especificado no convite e o e-mail do formulário não corresponde, retorna 400 com `{ error: "email_mismatch" }`.
8. Edge Function chama `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`.
9. Trigger `handle_new_user` cria `profiles` e `user_roles` com `role = 'user'`.
10. Edge Function executa `UPDATE user_roles SET role = 'admin' WHERE user_id = <novo_id>` via Service Role Key (bypass de RLS directo; `promote_to_admin` não é chamada aqui pois o contexto auth.uid() seria null com Service Role Key).
11. Edge Function marca token como usado dentro de transacção: `UPDATE admin_invites SET used = true WHERE token = <invite_token> AND used = false`; se nenhuma linha afectada (condição de corrida), reverte promoção e retorna 400.
12. Retorna 201 com `{ user_id, email, role: "admin" }`.
13. Frontend redireciona para `/auth/admin-login`.

**Fluxos alternativos e exceções**

- Bootstrap já executado: Edge Function detecta admin existente e retorna 409; operador não pode re-executar sem reset manual de `system_config`.
- Token expirado: retorna 400 `{ error: "token_invalid_or_expired" }`; utilizador deve pedir novo convite.
- Token já usado: mesmo comportamento que expirado; sem distinção na mensagem para evitar enumeração.
- Rate limit atingido: admin recebe 429 `{ error: "rate_limit_exceeded", retry_after: "<timestamp>" }`.
- CAPTCHA inválido: retorna 400 `{ error: "captcha_failed" }`; frontend exibe mensagem e recarrega CAPTCHA.
- E-mail já registado: `auth.admin.createUser` retorna erro; Edge Function propaga 409 `{ error: "email_already_registered" }`.
- Condição de corrida no token: dois requests simultâneos com mesmo token; o segundo UPDATE retorna 0 linhas afectadas; promoção é revertida e retorna 400.

**Diagrama de sequência (Fluxo C)**

```
Novo Admin       Frontend          Edge Function promote-admin      hCaptcha API     Supabase Auth     PostgreSQL
    |                |                        |                          |                 |                |
    |--acede link--->|                        |                          |                 |                |
    |                |--POST use_invite------>|                          |                 |                |
    |                |                        |--verify captcha--------->|                 |                |
    |                |                        |<--ok--------------------|                 |                |
    |                |                        |--SELECT admin_invites------------------------------------------------>|
    |                |                        |<--token válido-----------------------------------------------|
    |                |                        |--createUser------------------------------>|                 |
    |                |                        |<--user criado-----------------------------|                 |
    |                |                        |--UPDATE user_roles role=admin (Service Role Key)----------->|
    |                |                        |--UPDATE admin_invites used=true (Service Role Key)--------->|
    |                |<--201 user_id----------|                          |                 |                |
    |<--redirect login|                        |                          |                 |                |
```

---

### 5. Contratos públicos (assinaturas, endpoints, headers, exemplos)

**Edge Function: promote-admin**

- Tipo: endpoint HTTP
- Rota: `POST /functions/v1/promote-admin`
- Header obrigatório: `Content-Type: application/json`
- Sem prefixo de versão conforme ADR-010

**Modo bootstrap**

- Autenticação: sem JWT; validação por `bootstrap_token` no body

Exemplo de requisição:
```json
{
  "mode": "bootstrap",
  "bootstrap_token": "token-secreto-do-ambiente",
  "email": "admin@appxpro.online",
  "password": "SenhaForte123!",
  "full_name": "André dos Reis"
}
```

Exemplo de resposta 201:
```json
{
  "user_id": "uuid-do-novo-admin",
  "email": "admin@appxpro.online",
  "role": "admin"
}
```

**Modo create_invite**

- Autenticação: JWT de admin existente no header `Authorization: Bearer <token>`

Exemplo de requisição:
```json
{
  "mode": "create_invite",
  "email": "novo-admin@empresa.com"
}
```

Exemplo de resposta 201:
```json
{
  "invite_url": "https://app.appxpro.online/auth/signup?invite_token=abc123xyz",
  "expires_at": "2026-04-28T14:00:00Z"
}
```

**Modo use_invite**

- Autenticação: sem JWT; validação por `invite_token` + CAPTCHA

Exemplo de requisição:
```json
{
  "mode": "use_invite",
  "invite_token": "abc123xyz",
  "email": "novo-admin@empresa.com",
  "password": "SenhaForte123!",
  "full_name": "Nome Completo",
  "hcaptcha_token": "token-retornado-pelo-widget"
}
```

Exemplo de resposta 201:
```json
{
  "user_id": "uuid-do-novo-admin",
  "email": "novo-admin@empresa.com",
  "role": "admin"
}
```

**Semântica de status:**
- 201: operação concluída com sucesso
- 400: token inválido/expirado, CAPTCHA falhou, e-mail não corresponde, condição de corrida em token
- 403: JWT presente mas sem role admin (modo create_invite)
- 409: bootstrap já executado ou e-mail já registado
- 429: rate limit de convites atingido
- 500: erro interno (log gerado com request_id)

**Limites:**
- Payload máximo: 6 MB (limite Supabase Edge)
- Timeout: 10s
- Rate limit convites: 5 por admin por 24h

---

**Função SQL: promote_to_admin**

- Tipo: função SQL SECURITY DEFINER
- Assinatura: `promote_to_admin(target_user_id uuid) RETURNS void`
- Uso: reservada para chamadas futuras por admin autenticado via RPC (`/rpc/promote_to_admin`); a Edge Function `promote-admin` não usa esta função, realiza UPDATE directo com Service Role Key
- Valida `has_role(auth.uid(), 'admin')` antes de executar UPDATE; lança EXCEPTION se não for admin

```sql
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized: caller is not admin';
  END IF;
  UPDATE user_roles SET role = 'admin' WHERE user_id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: no user_roles record for %', target_user_id;
  END IF;
END;
$$;
```

---

**Endpoint de listagem de convites activos (PostgREST + RLS)**

- Tipo: endpoint HTTP (PostgREST directo)
- Rota: `GET /rest/v1/admin_invites?invited_by=eq.<uid>&used=eq.false&expires_at=gt.<now_iso>`
- Autenticação: `Authorization: Bearer <jwt-admin>`
- RLS garante que admin só vê os seus próprios convites

Exemplo de resposta 200:
```json
[
  {
    "id": "uuid",
    "token": "abc123xyz",
    "invited_by": "uuid-do-admin",
    "email": "novo-admin@empresa.com",
    "used": false,
    "expires_at": "2026-04-28T14:00:00Z",
    "created_at": "2026-04-26T14:00:00Z"
  }
]
```

---

### 6. Erros, exceções e fallback

**Matriz de erros previstos:**

| Condição | Tratamento | Notas |
|---|---|---|
| `bootstrap_token` inválido | 400 `{ error: "invalid_bootstrap_token" }` | Comparação de tempo constante; sem distinção de "errado" vs "já usado" |
| Bootstrap já executado (admin existe) | 409 `{ error: "bootstrap_already_done" }` | Verificado antes de criar utilizador |
| Token de convite expirado ou usado | 400 `{ error: "token_invalid_or_expired" }` | Sem distinção para evitar enumeração |
| E-mail do formulário diferente do convite | 400 `{ error: "email_mismatch" }` | Apenas quando convite tem e-mail restrito |
| CAPTCHA inválido | 400 `{ error: "captcha_failed" }` | Frontend recarrega widget |
| E-mail já registado no Supabase Auth | 409 `{ error: "email_already_registered" }` | Propagado do erro do `createUser` |
| Caller sem role admin (create_invite) | 403 `{ error: "forbidden" }` | JWT presente mas sem permissão |
| Rate limit atingido | 429 `{ error: "rate_limit_exceeded", retry_after: "<iso>" }` | 5 convites por admin por 24h |
| Condição de corrida no token | 400 `{ error: "token_invalid_or_expired" }` | UPDATE retornou 0 linhas; promoção revertida |
| Timeout na API hCaptcha | 400 `{ error: "captcha_service_unavailable" }` | Timeout de 10s; alerta gerado |
| Erro interno inesperado | 500 `{ error: "internal_error", request_id: "<uuid>" }` | Log estruturado com stack; nunca expor detalhes ao cliente |

**Estratégias de resiliência:**
- Timeout de 10s na chamada à API hCaptcha
- Sem retry automático em criação de utilizador (operação não idempotente sem verificação prévia)
- Verificação de idempotência do bootstrap: SELECT antes de INSERT garante que re-execução retorna 409 sem efeito colateral
- UPDATE em `admin_invites SET used = true WHERE token = X AND used = false` com verificação de `FOUND` protege contra condição de corrida

**Invariantes críticos:**
- Token de convite marcado como `used = true` e promoção executada são atomicamente dependentes; falha em qualquer um reverte o outro
- `ADMIN_BOOTSTRAP_TOKEN` nunca logado, nunca retornado em resposta
- `promote_to_admin` SQL nunca chamada com Service Role Key (context `auth.uid()` seria null); UPDATE directo com Service Role Key é o único caminho da Edge Function

**Fallback:**
- Se Edge Function `promote-admin` estiver indisponível, novo admin não consegue criar conta; operador pode criar utilizador manualmente via Supabase Auth Dashboard e executar UPDATE em `user_roles` com Service Role Key pelo Supabase SQL Editor

---

### 7. Observabilidade

**Métricas:**
- `promote_admin.bootstrap.success` (contador): bootstrap executado com sucesso; esperado exactamente 1 por ambiente de produção
- `promote_admin.invite.created` (contador por `invited_by`): convites gerados por admin
- `promote_admin.invite.used` (contador): convites aceites com sucesso
- `promote_admin.invite.expired` (contador): convites que expiraram sem uso (query periódica)
- `promote_admin.error` (contador por `error_code`): erros por tipo
- `promote_admin.captcha.failure` (contador): falhas de CAPTCHA (indicador de actividade de bot)
- `promote_admin.rate_limit.hit` (contador por `invited_by`): rate limit atingido por admin

**Logs:**

Formato: JSON estruturado. Campos obrigatórios em todos os eventos:

```json
{
  "timestamp": "2026-04-26T10:00:00.000Z",
  "level": "info|warn|error",
  "function": "promote-admin",
  "request_id": "uuid-v4",
  "mode": "bootstrap|create_invite|use_invite",
  "event": "invite_created|invite_used|bootstrap_done|error",
  "invited_by_hash": "sha256:...",
  "error": { "code": "", "message": "" }
}
```

Campos nunca logados: `bootstrap_token`, `invite_token` em texto puro, senha, JWT completo. `user_id` e `email` logados apenas como hash SHA-256 com salt.

**Tracing:**
- `promote-admin.request` (span raiz com `request_id`, `mode`)
- `promote-admin.captcha_verify` (span filho; duração da chamada hCaptcha)
- `promote-admin.db.invite_lookup` (span filho; SELECT em `admin_invites`)
- `promote-admin.auth.create_user` (span filho; chamada `auth.admin.createUser`)
- `promote-admin.db.promote` (span filho; UPDATE em `user_roles`)

Amostragem: 100% em v1.0 (volume baixo esperado).

**Dashboards e alertas:**
- Alerta: `promote_admin.captcha.failure > 10 em 5 minutos` indica actividade de bot; canal: e-mail do operador
- Alerta: `promote_admin.error{code=500} > 0` indica falha crítica; canal: e-mail do operador
- Painel: contagem de admins activos por dia (query em `user_roles WHERE role = 'admin'`)

---

### 8. Dependências e compatibilidade

| Componente | Versão mínima | Observações |
|---|---|---|
| Supabase Edge Functions (Deno) | Runtime actual Supabase | `crypto.randomUUID()` nativo no Deno |
| Supabase Auth Admin API | v2 | `auth.admin.createUser` com `email_confirm: true` |
| Supabase PostgreSQL | 15 | Função SECURITY DEFINER + `has_role` já existente |
| hCaptcha | API v1 | Plano free suficiente para volume inicial; site key configurada no frontend |
| React + Vite | 18 + 5.x | Modificação de `Signup.tsx` para aceitar `invite_token` via query param |
| Supabase JS Client | v2 | Chamadas existentes não são alteradas |

**Schema de `admin_invites`:**

```sql
CREATE TABLE admin_invites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text        UNIQUE NOT NULL,
  invited_by uuid        REFERENCES profiles(id) NOT NULL,
  email      text,
  used       boolean     NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_invites_token ON admin_invites(token) WHERE used = false;
CREATE INDEX idx_admin_invites_invited_by ON admin_invites(invited_by, created_at);
```

**Schema de `system_config`:**

```sql
CREATE TABLE system_config (
  key        text        PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- bootstrap registado como:
-- INSERT INTO system_config(key, value) VALUES ('bootstrap_done', 'true') ON CONFLICT (key) DO NOTHING;
```

**Políticas RLS em `admin_invites`:**
- SELECT: `invited_by = auth.uid()` e role = 'admin' (admin só vê os seus próprios convites)
- INSERT: apenas via Service Role Key (Edge Function); cliente nunca insere directamente
- UPDATE: apenas via Service Role Key (marcar `used = true`)
- DELETE: nenhuma policy; deleção não permitida

**Políticas RLS adicionais em `user_roles`:**
- Bloquear UPDATE pelo próprio utilizador: `USING (user_id != auth.uid())` na policy de UPDATE
- Toda promoção passa exclusivamente pelas Edge Functions via Service Role Key

**Garantias de compatibilidade:**
- A remoção do UPDATE directo em `Signup.tsx` não quebra nenhuma outra funcionalidade; nenhum outro componente depende deste fluxo
- A função `promote_to_admin` é nova; não altera assinaturas existentes
- A política RLS adicional em `user_roles` é aditiva; não quebra policies existentes de SELECT
- As tabelas `admin_invites` e `system_config` são novas; sem impacto em tabelas existentes

---

### 9. Critérios de aceite técnicos

- Aluno autenticado que executa `supabase.from('user_roles').update({ role: 'admin' }).eq('user_id', self)` directamente recebe erro RLS sem promoção
- Bootstrap executado com `ADMIN_BOOTSTRAP_TOKEN` correcto cria exactamente 1 admin e regista `bootstrap_done` em `system_config`
- Segunda execução de bootstrap retorna 409 sem criar utilizador adicional
- Token de convite expirado (TTL > 48h) retorna 400 sem criar utilizador
- Token de convite já usado retorna 400 sem criar segundo utilizador
- Dois requests simultâneos com o mesmo token: apenas um resulta em admin criado; o outro recebe 400
- CAPTCHA inválido retorna 400 sem processar o registo
- Rate limit de 5 convites por admin em 24h: o sexto pedido retorna 429
- Admin criado via convite tem `user_roles.role = 'admin'` no banco imediatamente após registo
- `/auth/signup` sem `invite_token` retorna 403 após bootstrap concluído
- Nenhum campo sensível (`bootstrap_token`, `invite_token`, senha) aparece nos logs estruturados
- Latência da Edge Function `promote-admin` (modo use_invite) p95 < 5s incluindo chamada hCaptcha

---

### 10. Riscos e mitigação

#### Risco 1: `ADMIN_BOOTSTRAP_TOKEN` vazado no ambiente

- **Probabilidade:** baixa
- **Impacto:** atacante cria primeiro admin antes do operador legítimo; se bootstrap já foi feito, token vazado é inútil
- **Mitigação:**
    - Token gerado com entropia alta (mínimo 32 bytes aleatórios)
    - Token armazenado apenas nos secrets do Supabase Edge; nunca em `.env` commitado
    - Rotação imediata após bootstrap; idealmente remover a variável do ambiente após o primeiro uso
    - Janela de risco é apenas entre deploy e execução do bootstrap; minimizar este intervalo
- **Plano de contingência:** se token vazar antes do bootstrap, regenerar antes de executar; se admin indesejado foi criado, eliminar via Supabase Auth Dashboard e repetir bootstrap

#### Risco 2: Esgotamento da tabela `admin_invites` por admin malicioso interno

- **Probabilidade:** baixa
- **Impacto:** médio; admin que gera 5 convites por dia e nunca os usa acumula registos; sem impacto funcional imediato mas ruído nos dados
- **Mitigação:**
    - Rate limit de 5 convites por 24h por admin
    - Job periódico (semanal) que marca como expirados tokens com `expires_at < now()` e `used = false`
    - Alerta se um único admin gerar mais de 20 convites num mês
- **Plano de contingência:** limpeza manual de `admin_invites` via Supabase Dashboard; revogar role admin do utilizador abusivo via UPDATE com Service Role Key

#### Risco 3: hCaptcha indisponível bloqueia registo legítimo

- **Probabilidade:** baixa (SLA hCaptcha > 99.9%)
- **Impacto:** médio; novos admins não conseguem criar conta durante indisponibilidade
- **Mitigação:**
    - Timeout de 10s na chamada à API hCaptcha com resposta 400 clara ao utilizador
    - Monitorização de `promote_admin.captcha.failure` com alerta se taxa subir sem actividade de bot conhecida
    - Possibilidade de desactivar CAPTCHA temporariamente via variável de ambiente `HCAPTCHA_ENABLED=false` (apenas para uso em emergência pelo operador)
- **Plano de contingência:** operador desactiva CAPTCHA temporariamente via env; cria conta manualmente via Supabase Auth Dashboard com UPDATE em `user_roles` via Service Role Key; reactiva CAPTCHA após restauração

#### Risco 4: Condição de corrida no uso simultâneo do mesmo token de convite

- **Probabilidade:** baixa (volume de admins é pequeno)
- **Impacto:** médio; dois utilizadores poderiam usar o mesmo token simultaneamente antes de um marcar `used = true`
- **Mitigação:**
    - `UPDATE admin_invites SET used = true WHERE token = X AND used = false` com verificação de `FOUND`; se não encontrar linha, o request reverte promoção e retorna 400
    - SELECT para validação do token usa `FOR UPDATE` para serializar acesso concorrente
    - Idempotência: se `createUser` já foi chamado e o segundo request falha no UPDATE do token, a conta criada fica com `role = 'user'` (não promovida); operador pode promover manualmente se necessário
- **Plano de contingência:** se duplicata for detectada (dois admins com mesmo e-mail impossível por constraint do Auth), operador promove o utilizador correcto manualmente via Service Role Key
