# Runbooks — APP XPRO

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-29  
**Autor:** André dos Reis  

---

## Sobre este documento

Operacionaliza os procedimentos de incident response (Tier 1) e operações comuns (Tier 2) descritos no Security Design Doc (SDD §14) e no HLD. Cada runbook cobre um procedimento concreto: quando usar, pré-requisitos, passos com comandos exactos, verificação, rollback (se aplicável) e comunicação (se aplicável).

Convenções:

- `<PROJECT_REF>` é o project ref do Supabase (ex: `abcdefghijklmnop`); obtém via `supabase projects list` ou Dashboard.
- `<ANON_KEY>`, `<SERVICE_ROLE_KEY>` em Dashboard → Settings → API.
- Comandos SQL correm via SQL Editor do Supabase Dashboard ou via `psql` com a connection string da Database.
- `<APP_DOMAIN>` é o domínio de produção (ex: `https://app.appxpro.com`).
- Tier 1 (IR-N): incident response.
- Tier 2 (OP-N): operações comuns.

---

## Índice

**Tier 1 — Incident Response**
- [IR-1: Service-role key vazada](#ir-1-service-role-key-vazada)
- [IR-2: Cross-tenant data leak via RLS gap](#ir-2-cross-tenant-data-leak-via-rls-gap)
- [IR-3: Webhook secret comprometido](#ir-3-webhook-secret-comprometido)
- [IR-4: Privilege escalation em `user_roles`](#ir-4-privilege-escalation-em-user_roles)
- [IR-5: Vazamento de URL de Storage privado (PDF)](#ir-5-vazamento-de-url-de-storage-privado-pdf)
- [IR-6: Webhook payload duplicado em produção](#ir-6-webhook-payload-duplicado-em-produção)
- [IR-7: Delete acidental em produção](#ir-7-delete-acidental-em-produção)

**Tier 2 — Operações comuns**
- [OP-1: Deploy de Edge Function](#op-1-deploy-de-edge-function)
- [OP-2: Aplicar migration SQL em produção](#op-2-aplicar-migration-sql-em-produção)
- [OP-3: Restore parcial via backup Supabase](#op-3-restore-parcial-via-backup-supabase)
- [OP-4: Convidar admin manualmente (bootstrap)](#op-4-convidar-admin-manualmente-bootstrap)
- [OP-5: Liberar acesso de aluno a um produto manualmente](#op-5-liberar-acesso-de-aluno-a-um-produto-manualmente)
- [OP-6: Reset de password via support](#op-6-reset-de-password-via-support)
- [OP-7: Rotacionar webhook secret](#op-7-rotacionar-webhook-secret)

---

## Tier 1 — Incident Response

### IR-1: Service-role key vazada

**Quando usar:** detecção de chamadas inesperadas com role `service_role` em logs Supabase; alerta de regex em GitGuardian/TruffleHog/secret scanner; report manual de exposição (slack, e-mail).

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Supabase CLI autenticado (`supabase login`)
- Acesso de write ao repositório (rotation propaga via redeploy)

**Passos:**

1. **Rotacionar a key:** Dashboard → Settings → API → "Reset service_role key". Confirmar em prompt. Copiar nova key imediatamente para clipboard seguro.
2. **Actualizar secret nas Edge Functions:**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<NEW_KEY>" --project-ref <PROJECT_REF>
   ```
3. **Redeploy de todas as Edge Functions** (a key antiga deixa de funcionar imediatamente; functions sem redeploy começam a falhar):
   ```bash
   supabase functions deploy --project-ref <PROJECT_REF>
   ```
4. **Auditar uso suspeito:** correr no SQL Editor:
   ```sql
   -- Identificar mutações nas últimas 48 h em tabelas críticas
   SELECT 'user_roles' AS tbl, id, user_id, role, created_at, updated_at
   FROM public.user_roles
   WHERE created_at > NOW() - INTERVAL '48 hours' OR updated_at > NOW() - INTERVAL '48 hours'
   UNION ALL
   SELECT 'purchases', id::text, user_id::text, status::text, created_at, updated_at
   FROM public.purchases
   WHERE created_at > NOW() - INTERVAL '48 hours' OR updated_at > NOW() - INTERVAL '48 hours';
   ```
5. **Reverter mutações suspeitas** caso se confirmem:
   ```sql
   -- Exemplo: reverter promoção indevida
   UPDATE public.user_roles SET role = 'user' WHERE user_id = '<UUID>';
   ```

**Verificação:**
- `curl` a uma Edge Function com a key antiga retorna 401 ou 403
- Logs Supabase nas últimas 30 min mostram apenas chamadas de Edge Functions com a nova key
- SQL `SELECT COUNT(*)` em tabelas afectadas alinhado com expectativa pre-incident

**Rollback:** não aplicável (rotação é progressão; key antiga fica permanentemente revogada).

**Comunicação:**
- Se houve acesso confirmado a dados de utilizadores: notificar afectados em ≤ 72 h conforme Art. 48 LGPD
- Post-mortem dentro de 5 dias úteis: documentar como a key vazou e adicionar controlos preventivos (CI scan, ambiente de variáveis encriptado)

---

### IR-2: Cross-tenant data leak via RLS gap

**Quando usar:** report de utilizador a ver dados de outro tenant; auditoria de release detecta gap; logs Sentry mostram queries com resultados inesperados a travessar boundaries.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Acesso de write ao repositório
- Capacidade de fazer rollback de PR

**Passos:**

1. **Conter imediatamente:**
   - Se gap é em página específica: rollback do PR que introduziu a feature.
     ```bash
     git revert <COMMIT_SHA> --no-edit && git push origin main
     ```
   - Se gap é em RLS policy: desactivar feature por flag (toggle env var) ou drop policy permissiva.
2. **Identificar policy afectada:** SQL Editor:
   ```sql
   SELECT schemaname, tablename, policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = '<TABELA>';
   ```
3. **Corrigir policy:** drop e recriar com expressão correcta:
   ```sql
   DROP POLICY "<POLICY_NAME>" ON public.<TABELA>;
   CREATE POLICY "<POLICY_NAME>" ON public.<TABELA>
     FOR <SELECT|UPDATE|...>
     USING (auth.uid() = user_id);
   ```
4. **Validar com 2 contas:**
   - Login como aluno A; tentar SELECT em linhas de aluno B → deve retornar 0 linhas.
   - Login como admin A; tentar SELECT em produtos de admin B → deve retornar 0 linhas.
5. **Auditar dados acedidos:** Supabase Logs → Edge Functions / PostgREST → filtrar por `user_id` suspeito nas últimas 48 h. Identificar quem acedeu a quê.

**Verificação:**
- Testes manuais com 2 contas confirmam isolamento
- `pg_policies` lista a nova policy correctamente

**Rollback:** rever para policy anterior se nova policy bloquear acesso legítimo (ler logs com 401/403 em queries normais por 15 min após deploy).

**Comunicação:**
- Notificar utilizadores afectados em ≤ 72 h se confirmado vazamento de dados pessoais (Art. 48 LGPD)
- Adicionar caso ao checklist de PR template
- Acelerar suite automatizada de testes de isolamento

---

### IR-3: Webhook secret comprometido

**Quando usar:** webhook com assinatura válida mas payload anómalo (valor estranho, produto inexistente); volume súbito de compras de uma plataforma sem campanha de marketing; report de admin de compras desconhecidas.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Credenciais para painel da plataforma de pagamento afectada (Hotmart, Kiwify, Monetizze, Stripe, Eduzz)

**Passos:**

1. **Identificar janela de incidente:** SQL Editor:
   ```sql
   -- Compras suspeitas das últimas 24 h
   SELECT id, user_id, product_id, external_transaction_id, amount, currency, status, created_at
   FROM public.purchases
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```
2. **Cancelar compras forjadas confirmadas:**
   ```sql
   UPDATE public.purchases
     SET status = 'cancelled', updated_at = NOW()
   WHERE id IN ('<UUID1>', '<UUID2>', ...);
   ```
3. **Rotacionar o secret:**
   - **Estado actual (v1.0, secret global):**
     - Gerar novo secret seguro (`openssl rand -hex 32`)
     - Actualizar no Supabase: `supabase secrets set WEBHOOK_SECRET="<NEW_SECRET>" --project-ref <PROJECT_REF>`
     - Redeploy: `supabase functions deploy webhook-payment --project-ref <PROJECT_REF>`
     - Actualizar URL/secret em **todas as plataformas** que usam webhooks
   - **Estado alvo (per-product):**
     ```sql
     UPDATE public.products
       SET webhook_secret = encode(gen_random_bytes(32), 'hex')
     WHERE id = '<PRODUCT_UUID>';
     ```
     - Comunicar novo secret ao admin do produto via canal seguro
4. **Reconciliar com plataforma de pagamento:** confirmar com o admin que cada `external_transaction_id` listado em §1 corresponde a transacção real na plataforma. Compras sem correspondência são forjadas.
5. **Emitir refund para falsos positivos** (se houve cobrança real): via painel da plataforma afectada.

**Verificação:**
- Próximo webhook real é processado normalmente com novo secret
- `purchases.status = 'cancelled'` para forjadas confirmadas
- Painel da plataforma reflecte refunds emitidos

**Rollback:** não aplicável. Rotação é progressão.

**Comunicação:**
- Notificar admin afectado da rotação e situação
- Notificar alunos cujo acesso foi indevidamente concedido (e revogar via SQL UPDATE em `purchases.status`)
- Acelerar migração para per-product secret se ainda em estado global

---

### IR-4: Privilege escalation em `user_roles`

**Quando usar:** linha em `user_roles` com `role='admin'` cujo `created_at` ou `updated_at` não corresponde a chamada legítima a `promote_to_admin`; aluno reporta acesso indevido a `/admin/*`; auditoria detecta admin não esperado.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Acesso ao SQL Editor

**Passos:**

1. **Identificar promoções suspeitas:**
   ```sql
   SELECT ur.user_id, ur.role, ur.created_at, ur.updated_at, p.email
   FROM public.user_roles ur
   JOIN public.profiles p ON p.id = ur.user_id
   WHERE ur.role = 'admin'
   ORDER BY ur.updated_at DESC NULLS LAST, ur.created_at DESC
   LIMIT 50;
   ```
   Comparar com lista de admins legítimos conhecidos.
2. **Reverter role do utilizador suspeito:**
   ```sql
   UPDATE public.user_roles
     SET role = 'user', updated_at = NOW()
   WHERE user_id = '<SUSPICIOUS_UUID>';
   ```
3. **Invalidar sessões activas** do utilizador escalado:
   ```sql
   DELETE FROM auth.refresh_tokens WHERE user_id = '<SUSPICIOUS_UUID>';
   ```
   (Próximo request com JWT antigo continua válido até expirar; refresh falhará e força re-login.)
4. **Confirmar `promote_to_admin SECURITY DEFINER` activa** e RLS bloqueando UPDATE pelo próprio user:
   ```sql
   -- Verificar function existe e é SECURITY DEFINER
   SELECT proname, prosecdef FROM pg_proc WHERE proname = 'promote_to_admin';

   -- Verificar policies de UPDATE em user_roles
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'user_roles' AND cmd = 'UPDATE';
   ```
5. **Auditar dados acedidos:** identificar produtos cujo admin foi suspeitosamente acedido (via logs Supabase de queries no janela suspeita).

**Verificação:**
- `user_roles.role = 'user'` para o utilizador revertido
- `auth.refresh_tokens` sem entries para o utilizador
- `promote_to_admin` é `SECURITY DEFINER`; RLS bloqueia UPDATE pelo próprio user

**Rollback:** se utilizador era admin legítimo (falso positivo): reverter `UPDATE public.user_roles SET role = 'admin' WHERE user_id = '<UUID>';`.

**Comunicação:**
- Notificar admins legítimos cujo produto foi acedido pelo escalado
- Post-mortem: validar que ADR-004 + FDD-001 estão completamente implementados

---

### IR-5: Vazamento de URL de Storage privado (PDF)

**Quando usar:** report de utilizador; volume súbito de downloads do mesmo path por IPs diferentes (logs Storage); URL partilhada visivelmente em redes sociais ou fórum.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Acesso ao Storage via dashboard ou Supabase JS Client com service-role

**Passos:**

1. **Identificar ficheiro afectado** a partir do path do URL.
2. **Mover ficheiro para quarentena** (invalida URLs activas instantaneamente):
   - Via Dashboard: Storage → bucket → ficheiro → "Move" → destino `quarantine/<timestamp>-<filename>`
   - Via SQL com extensão storage:
     ```sql
     -- Renomeia o object key
     UPDATE storage.objects
       SET name = 'quarantine/' || extract(epoch from now())::int || '-' || split_part(name, '/', -1)
     WHERE bucket_id = '<BUCKET>' AND name = '<ORIGINAL_PATH>';
     ```
3. **Reupload do ficheiro com novo path único:**
   ```bash
   # Ex: gerar novo path e reupload
   NEW_PATH="<USER_ID>/$(uuidgen).pdf"
   supabase storage cp <ORIGINAL_LOCAL_FILE> "<BUCKET>/$NEW_PATH" --project-ref <PROJECT_REF>
   ```
4. **Actualizar referência na tabela:**
   ```sql
   -- Para PDF de módulo
   UPDATE public.modules SET pdf_url = '<NEW_PATH>' WHERE id = '<MODULE_UUID>';

   -- Para certificado
   UPDATE public.certificates SET pdf_url = '<NEW_PATH>' WHERE id = '<CERT_UUID>';
   ```
5. **Validar acesso:** abrir aplicação como aluno legítimo; confirmar download funciona com novo path.

**Verificação:**
- URL antiga retorna 404 (ficheiro renomeado)
- Aluno legítimo descarrega com sucesso
- Logs Storage mostram acessos apenas a novo path

**Rollback:** mover ficheiro de volta de `quarantine/` para path original; reverter UPDATE da tabela. Não recomendado se vazamento foi confirmado.

**Comunicação:**
- E-mail Resend ao utilizador afectado explicando situação e disponibilizando novo link
- Se confirmada partilha intencional (não vazamento técnico): rever termos do produto e ajustar comunicação ao admin

---

### IR-6: Webhook payload duplicado em produção

**Quando usar:** plataforma reenvia webhook após resposta lenta ou timeout; alunos reportam acesso duplicado, e-mails duplicados ou certificados com número diferente para o mesmo curso; logs mostram múltiplos `INSERT` para o mesmo `external_transaction_id`.

**Pré-requisitos:**
- Acesso ao SQL Editor

**Passos:**

1. **Verificar constraint UNIQUE está activa:**
   ```sql
   SELECT conname, contype, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'public.purchases'::regclass
     AND contype = 'u';
   ```
   Procurar por `UNIQUE (external_transaction_id)`. Se ausente, este é o root cause; aplicar migration de OP-2.
2. **Identificar duplicações existentes** (apenas se constraint estava ausente quando webhook chegou):
   ```sql
   SELECT external_transaction_id, COUNT(*) AS dup_count, array_agg(id) AS purchase_ids
   FROM public.purchases
   WHERE external_transaction_id IS NOT NULL
   GROUP BY external_transaction_id
   HAVING COUNT(*) > 1
   ORDER BY dup_count DESC;
   ```
3. **Manter o `purchase` mais antigo, cancelar os outros:**
   ```sql
   WITH ranked AS (
     SELECT id, external_transaction_id,
            row_number() OVER (PARTITION BY external_transaction_id ORDER BY created_at) AS rn
     FROM public.purchases
     WHERE external_transaction_id IN ('<TXN_ID_1>', '<TXN_ID_2>')
   )
   UPDATE public.purchases
     SET status = 'cancelled', updated_at = NOW()
   WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
   ```
   (Não DELETE, para preservar histórico; apenas cancelar duplicações.)
4. **Aplicar constraint** (se ainda ausente; ver OP-2 para fluxo completo):
   ```sql
   ALTER TABLE public.purchases
     ADD CONSTRAINT purchases_external_transaction_id_key UNIQUE (external_transaction_id);
   ```
5. **Confirmar idempotência** funcionando: na próxima retry da plataforma, INSERT viola constraint e Edge Function retorna 200 OK.

**Verificação:**
- `pg_constraint` lista a UNIQUE em `external_transaction_id`
- Query do passo 2 retorna 0 linhas após cleanup
- Próximo webhook real processa normalmente

**Rollback:** não aplicável. Cancelar duplicações é progressão; reverter exigiria criar duplicações novas, sem benefício.

**Comunicação:**
- Notificar admin do produto afectado: explicar correcção e validar reconciliação com plataforma
- Se aluno tinha múltiplos certificados para o mesmo produto: cancelar todos excepto o mais antigo:
  ```sql
  WITH ranked AS (
    SELECT id, row_number() OVER (PARTITION BY user_id, product_id ORDER BY created_at) AS rn
    FROM public.certificates
  )
  DELETE FROM public.certificates WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
  ```

---

### IR-7: Delete acidental em produção

**Quando usar:** admin reporta produto/módulo apagado por engano; logs Supabase confirmam DELETE recente; alunos reportam perda de acesso a curso comprado.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Plano Pro contratado (backups automáticos diários)
- Capacidade de fazer Point-in-Time Recovery (PITR; alvo Supabase Team Tier)

**Passos:**

1. **Bloquear novas escritas** relacionadas com o objecto apagado, se possível, para evitar interferir com restore:
   - Notificar admin para não recriar manualmente o produto até restore concluir.
2. **Identificar timestamp do DELETE:** logs Supabase Database, filtrar por `DELETE FROM public.<TABELA>` na janela suspeita.
3. **Backup-based restore (Supabase Pro, RTO ~horas):**
   - Dashboard → Database → Backups → escolher backup imediatamente anterior ao timestamp do DELETE
   - "Restore to new project" cria projecto auxiliar com schema + dados pre-DELETE
   - Identificar UUIDs das linhas perdidas no projecto auxiliar:
     ```sql
     -- No projecto auxiliar (restore)
     SELECT * FROM public.<TABELA> WHERE id IN ('<UUID1>', '<UUID2>', ...);
     ```
   - Exportar via SQL Editor → CSV ou via `pg_dump` específico das linhas
   - Reinserir no projecto produção:
     ```sql
     -- Em produção, após copiar da auxiliar
     INSERT INTO public.<TABELA> (col1, col2, ...) VALUES (...);
     ```
4. **Point-in-Time Recovery (Supabase Team, RTO ~minutos)** quando disponível:
   - Dashboard → Database → PITR → escolher timestamp pre-DELETE
   - Aplicar a tabelas específicas via Supabase support (ainda manual em v1.0)
5. **Validar integridade:**
   ```sql
   -- Confirmar que linhas restauradas têm referências consistentes
   SELECT COUNT(*) FROM public.modules WHERE product_id = '<PRODUCT_UUID>';
   SELECT COUNT(*) FROM public.purchases WHERE product_id = '<PRODUCT_UUID>';
   SELECT COUNT(*) FROM public.user_progress WHERE module_id IN
     (SELECT id FROM public.modules WHERE product_id = '<PRODUCT_UUID>');
   ```

**Verificação:**
- Admin confirma produto/módulo visível e funcional no dashboard
- Aluno confirma acesso restaurado
- Counts em `modules`, `purchases`, `user_progress` consistentes com pre-DELETE

**Rollback:** se restore introduziu inconsistência: revert do INSERT específico (DELETE com WHERE preciso). Documentar e refazer com mais cuidado.

**Comunicação:**
- Admin afectado: estimativa de RTO e progresso do restore
- Alunos do produto: aviso de indisponibilidade temporária e previsão de restauração
- Post-mortem: acelerar implementação de soft-delete via `deleted_at` (HLD Risco 10)

---

## Tier 2 — Operações comuns

### OP-1: Deploy de Edge Function

**Quando usar:** alteração em código de uma Edge Function; introdução de nova Edge Function.

**Pré-requisitos:**
- Supabase CLI autenticado (`supabase login`)
- Acesso de write ao projecto Supabase
- Branch local com alteração; CI verde

**Passos:**

1. **Validar localmente:**
   ```bash
   supabase functions serve <FUNCTION_NAME> --env-file .env.local
   # Em outro terminal: testar via curl
   curl -X POST http://localhost:54321/functions/v1/<FUNCTION_NAME> \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"productId": "<UUID>"}'
   ```
2. **Verificar segredos necessários estão configurados em produção:**
   ```bash
   supabase secrets list --project-ref <PROJECT_REF>
   ```
3. **Deploy:**
   ```bash
   supabase functions deploy <FUNCTION_NAME> --project-ref <PROJECT_REF>
   ```
4. **Smoke test em produção:**
   ```bash
   curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/<FUNCTION_NAME> \
     -H "Authorization: Bearer <ANON_OR_USER_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '<TEST_PAYLOAD>'
   ```
5. **Monitorizar logs nas primeiras 15 min:** Dashboard → Edge Functions → `<FUNCTION_NAME>` → Logs.

**Verificação:**
- Endpoint retorna response esperado em smoke test
- Logs sem erros não esperados nos primeiros 15 min
- Sentry não regista picos de errors

**Rollback:**
```bash
# Via git, redeploy da versão anterior
git checkout <PREVIOUS_COMMIT> -- supabase/functions/<FUNCTION_NAME>
supabase functions deploy <FUNCTION_NAME> --project-ref <PROJECT_REF>
git checkout HEAD -- supabase/functions/<FUNCTION_NAME>
```

**Comunicação:** apenas se for breaking change em interface pública (ver ADR-010 + IR-3 para coordenar comunicação a plataformas externas).

---

### OP-2: Aplicar migration SQL em produção

**Quando usar:** alteração de schema (DDL): nova tabela, coluna, índice, constraint, policy RLS, function, trigger.

**Pré-requisitos:**
- Migration testada localmente ou em staging
- Backup recente do projecto (auto Pro; manual via Dashboard se Free)
- Janela de manutenção comunicada se migration tem locking pesado (ALTER TABLE em tabela grande)

**Passos:**

1. **Backup explícito antes da migration** (precaução adicional):
   - Dashboard → Database → Backups → "Create backup now"
2. **Validar migration localmente** com Supabase CLI ou via clone do schema:
   ```bash
   # Aplicar localmente via Supabase CLI
   supabase db reset --local
   supabase migration up --local
   # Ou: copiar SQL para SQL Editor de instância de staging
   ```
3. **Aplicar em produção via SQL Editor** (preferencial em v1.0; alvo é via `supabase/migrations/` com CLI conforme ADR-012):
   - Dashboard → SQL Editor → New query
   - Colar SQL completo
   - Executar com `Run`
4. **Migrações destrutivas** (DROP TABLE, DROP COLUMN, RENAME): correr em duas fases para minimizar downtime:
   - Fase 1: criar nova versão (ex: nova coluna `email_verified BOOLEAN DEFAULT FALSE`)
   - Deploy de aplicação a usar nova coluna em paralelo com antiga
   - Fase 2 (após confirmação): DROP da coluna antiga
5. **Aplicar constraint UNIQUE** que pode falhar com dados existentes:
   ```sql
   -- Tentar criar a constraint
   ALTER TABLE public.purchases
     ADD CONSTRAINT purchases_external_transaction_id_key UNIQUE (external_transaction_id);
   -- Se falhar com duplicações, executar IR-6 primeiro
   ```

**Verificação:**
```sql
-- Confirmar schema desejado
\d public.<TABELA>  -- via psql
-- ou
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABELA>';
```

**Rollback:** preparar SQL inverso (ex: `ALTER TABLE ... DROP COLUMN ...` para reverter ADD COLUMN). Para migrações destrutivas, restore de backup é o último recurso (RTO em horas).

**Comunicação:** se migration tem locking pesado, comunicar janela de manutenção.

---

### OP-3: Restore parcial via backup Supabase

**Quando usar:** delete acidental (ver IR-7); corrupção de dados detectada; rollback após migration falhada.

**Pré-requisitos:**
- Plano Pro ou superior (backups automáticos diários)
- Acesso de Owner ao Dashboard

**Passos:**

1. **Identificar backup adequado:** Dashboard → Database → Backups. Escolher backup imediatamente anterior ao incident.
2. **Restore para projecto auxiliar:**
   - "Restore to new project" cria clone temporário com schema + dados do backup
   - Aguardar conclusão (RTO típico: 30 min a 2 h)
3. **Identificar dados a restaurar** no projecto auxiliar via SQL Editor:
   ```sql
   -- Ex: linhas apagadas
   SELECT * FROM public.<TABELA> WHERE id IN ('<UUID1>', '<UUID2>');
   ```
4. **Exportar dados em formato adequado:**
   - SQL Editor → "Export to CSV" para volumes pequenos
   - `pg_dump --data-only --table=public.<TABELA> --rows-per-insert=100` para volumes maiores
5. **Importar no projecto produção:**
   - SQL Editor → executar `INSERT` reconstruído com base nos dados do auxiliar
   - **Cuidado com IDs:** se PK for UUID, manter; se for sequência, podem colidir
6. **Apagar projecto auxiliar** após validação (custo extra Supabase mantém-se enquanto auxiliar existir):
   - Dashboard do auxiliar → Settings → Pause/Delete project

**Verificação:**
- Counts e relações restauradas consistentes
- FKs para tabelas dependentes resolvem (sem orphan rows)
- Aplicação serve dados restaurados normalmente

**Rollback:** se import causar problemas, identificar UUIDs inseridos e DELETE específico. Não usar TRUNCATE.

**Comunicação:** estimativa de RTO comunicada à parte afectada (admin, alunos).

---

### OP-4: Convidar admin manualmente (bootstrap)

**Quando usar:** primeiro admin da plataforma (não há admin existente para usar fluxo normal de FDD-001); promoção de support/owner para admin em recovery.

**Pré-requisitos:**
- Conta com SQL Editor access ou direct DB connection
- `ADMIN_BOOTSTRAP_TOKEN` configurado em Supabase Vault (FDD-001)

**Passos:**

1. **Garantir utilizador alvo já existe** (signup feito normalmente):
   ```sql
   SELECT id, email FROM public.profiles WHERE email = '<TARGET_EMAIL>';
   ```
   Se não existe, pedir ao utilizador que faça signup primeiro.
2. **Promoção via Edge Function `promote-admin` com bootstrap token (caminho preferido per FDD-001):**
   ```bash
   curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/promote-admin \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "bootstrap",
       "bootstrap_token": "<ADMIN_BOOTSTRAP_TOKEN>",
       "target_email": "<TARGET_EMAIL>"
     }'
   ```
3. **Promoção directa via SQL** (uso restrito para emergência ou debug; bypassa SECURITY DEFINER):
   ```sql
   UPDATE public.user_roles SET role = 'admin'
   WHERE user_id = (SELECT id FROM public.profiles WHERE email = '<TARGET_EMAIL>');
   ```
4. **Invalidar bootstrap token após uso** (parte do ciclo de vida em SDD §6.2):
   - Dashboard → Settings → API → secrets → editar `ADMIN_BOOTSTRAP_TOKEN` para novo valor
5. **Confirmar role aplicada:**
   ```sql
   SELECT p.email, ur.role
   FROM public.profiles p
   JOIN public.user_roles ur ON ur.user_id = p.id
   WHERE p.email = '<TARGET_EMAIL>';
   ```

**Verificação:**
- `user_roles.role = 'admin'` para o utilizador alvo
- Login do utilizador redirecciona para `/admin/*`
- Bootstrap token rotacionado para próximo uso

**Rollback:**
```sql
UPDATE public.user_roles SET role = 'user'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = '<TARGET_EMAIL>');
```

**Comunicação:** notificar utilizador alvo que role foi atribuída.

---

### OP-5: Liberar acesso de aluno a um produto manualmente

**Quando usar:** admin liberou acesso oferta gratuita; reembolso de plataforma de pagamento ainda não reflectiu via webhook; sortei/cortesia.

**Pré-requisitos:**
- SQL Editor access
- UUID do aluno e do produto

**Passos:**

1. **Identificar aluno e produto:**
   ```sql
   SELECT id FROM public.profiles WHERE email = '<STUDENT_EMAIL>';
   SELECT id, title FROM public.products WHERE id = '<PRODUCT_UUID>' OR title ILIKE '<PRODUCT_TITLE>%';
   ```
2. **Inserir purchase aprovada manualmente:**
   ```sql
   INSERT INTO public.purchases (
     user_id, product_id, status, amount, currency,
     external_transaction_id, expires_at, created_at, updated_at
   ) VALUES (
     '<STUDENT_UUID>',
     '<PRODUCT_UUID>',
     'approved',
     0,
     'BRL',
     'manual-' || gen_random_uuid()::text,  -- evita colisão com UNIQUE
     NULL,                                    -- acesso perpétuo; ou data específica
     NOW(),
     NOW()
   );
   ```
3. **Confirmar acesso via aplicação:** aluno recarrega `/student` e produto deve aparecer na lista.

**Verificação:**
```sql
SELECT p.email, prod.title, pur.status, pur.expires_at
FROM public.purchases pur
JOIN public.profiles p ON p.id = pur.user_id
JOIN public.products prod ON prod.id = pur.product_id
WHERE pur.user_id = '<STUDENT_UUID>' AND pur.product_id = '<PRODUCT_UUID>';
```

**Rollback:**
```sql
UPDATE public.purchases SET status = 'cancelled', updated_at = NOW()
WHERE user_id = '<STUDENT_UUID>' AND product_id = '<PRODUCT_UUID>'
  AND external_transaction_id LIKE 'manual-%';
```

**Comunicação:** notificar aluno que acesso foi concedido (e-mail manual via Resend ou directamente pelo admin).

---

### OP-6: Reset de password via support

**Quando usar:** aluno perde acesso a e-mail e não consegue usar fluxo de recovery; admin pede reset de password de aluno cujo e-mail foi invalidado.

**Pré-requisitos:**
- Owner ou Admin do Supabase
- Confirmação prévia de identidade do utilizador (via canal seguro)

**Passos:**

1. **Identificar utilizador:**
   ```sql
   SELECT id, email FROM public.profiles WHERE email = '<USER_EMAIL>';
   ```
2. **Opção A: gerar magic link via Admin Auth API:**
   ```bash
   curl -X POST 'https://<PROJECT_REF>.supabase.co/auth/v1/admin/users/<USER_UUID>/recover' \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Magic link é gerado e enviado para o e-mail registado. Se e-mail está invalidado, usar opção B.
3. **Opção B: alterar e-mail antes de gerar link** (caso e-mail antigo perdido):
   ```bash
   curl -X PUT 'https://<PROJECT_REF>.supabase.co/auth/v1/admin/users/<USER_UUID>' \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"email": "<NEW_EMAIL>"}'
   # Depois trigger recovery para o novo e-mail
   ```
   Confirmar com utilizador antes de mudar e-mail.
4. **Opção C: definir password directamente** (último recurso; password temporária a ser trocada no próximo login):
   ```bash
   curl -X PUT 'https://<PROJECT_REF>.supabase.co/auth/v1/admin/users/<USER_UUID>' \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"password": "<TEMPORARY_PASSWORD>"}'
   ```
   Comunicar password ao utilizador via canal seguro (telefone, e-mail alternativo verificado).

**Verificação:**
- Utilizador consegue fazer login com nova credencial
- Logs Supabase mostram `auth.users.updated_at` correspondente

**Rollback:** não aplicável. Reset é progressão.

**Comunicação:**
- Confirmar identidade antes de qualquer reset
- Password temporária via canal seguro fora do e-mail
- Pedir ao utilizador que altere a password no primeiro login

---

### OP-7: Rotacionar webhook secret

**Quando usar:** rotação periódica (alvo trimestral); incidente confirmado (ver IR-3); migração para per-product secret.

**Pré-requisitos:**
- Acesso de Owner ao Supabase Dashboard
- Acesso aos painéis das plataformas de pagamento configuradas
- Coordenação com admin do produto se per-product secret

**Passos:**

1. **Gerar novo secret seguro:**
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   echo "$NEW_SECRET"
   ```
2. **Estado actual (secret global):**
   ```bash
   supabase secrets set WEBHOOK_SECRET="$NEW_SECRET" --project-ref <PROJECT_REF>
   supabase functions deploy webhook-payment --project-ref <PROJECT_REF>
   ```
   Actualizar imediatamente o secret em **todas as plataformas configuradas** (Hotmart, Kiwify, Monetizze, Eduzz, Stripe). Janela entre Supabase update e plataforma update produz webhooks rejeitados; planejar rotação numa janela de baixo tráfego.
3. **Estado alvo (per-product secret):**
   ```sql
   UPDATE public.products
     SET webhook_secret = encode(gen_random_bytes(32), 'hex')
   WHERE id = '<PRODUCT_UUID>';

   -- Retornar o novo secret para comunicar ao admin
   SELECT id, title, webhook_secret FROM public.products WHERE id = '<PRODUCT_UUID>';
   ```
   Comunicar novo secret ao admin via canal seguro; admin actualiza nas suas plataformas.
4. **Para Stripe (chave separada):**
   - Dashboard Stripe → Developers → Webhooks → endpoint → Reveal signing secret
   - Configurar novo `STRIPE_WEBHOOK_SECRET` no Supabase Vault
   - `supabase secrets set STRIPE_WEBHOOK_SECRET="<NEW_VALUE>" --project-ref <PROJECT_REF>`
   - Redeploy de `webhook-payment`
5. **Monitorizar logs nos próximos 30 min:** Dashboard → Edge Functions → `webhook-payment` → procurar por erros 401 (signature mismatch) que indicam plataforma ainda com secret antigo.

**Verificação:**
- Webhook real chega e é processado normalmente com novo secret
- Logs sem 401 sustentado (transitório aceitável durante janela de update das plataformas)

**Rollback:** se rotação causar bloqueio prolongado, repor secret antigo temporariamente:
```bash
supabase secrets set WEBHOOK_SECRET="<OLD_SECRET>" --project-ref <PROJECT_REF>
supabase functions deploy webhook-payment --project-ref <PROJECT_REF>
```
Investigar root cause antes de retentar rotação.

**Comunicação:**
- Per-product secret: notificar admin do produto antes da rotação
- Global secret: comunicação a todos os admins é dispendiosa; preferir migrar para per-product antes da próxima rotação

---

*Runbooks de v1.0. Tier 3 (manutenção periódica) fica para v1.x: auditoria RLS por release, limpeza manual de `webhook_logs`, verificação Lighthouse PWA, monitorização de quota Storage. Comandos exactos podem evoluir conforme novos planos Supabase ou alterações na CLI; rever este documento sempre que migração de tooling.*
