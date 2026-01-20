# 🔧 Solução para "Database error querying schema"

## 🎯 Problema Identificado

O erro aparece na tela de login quando o código tenta buscar a **role** do usuário na tabela `user_roles`.

### Onde ocorre o erro:
[src/hooks/useAuth.tsx](../../../src/hooks/useAuth.tsx) - linhas 90-94

```typescript
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user?.id)
  .maybeSingle();
```

## 🔍 Causa Raiz

A tabela `user_roles` está com **RLS (Row Level Security) habilitado**, mas:

1. **Políticas RLS ausentes ou incorretas** - Bloqueando acesso à leitura
2. **Constraint UNIQUE errada** - Pode ter `UNIQUE(user_id, role)` ao invés de `UNIQUE(user_id)`
3. **Tipo ENUM não criado** - Faltando o tipo `app_role`
4. **Profile/Role do admin não existe** - Usuário sem dados na tabela

## ✅ Solução Completa

### Passo 1: Executar Diagnóstico

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard/project/qdaorpyedwpcaaezsaxp)
2. Vá em **SQL Editor**
3. Execute o arquivo: [DIAGNOSTICO_ERRO_SCHEMA.sql](DIAGNOSTICO_ERRO_SCHEMA.sql)
4. Analise os resultados

### Passo 2: Aplicar Correção

Execute o arquivo: [CORRIGIR_RLS_USER_ROLES.sql](CORRIGIR_RLS_USER_ROLES.sql)

Este SQL vai:
- ✅ Remover políticas antigas incorretas
- ✅ Criar política RLS correta para leitura
- ✅ Garantir que o tipo ENUM `app_role` existe
- ✅ Corrigir a constraint UNIQUE
- ✅ Criar profile e role do admin
- ✅ Verificar se tudo está funcionando

### Passo 3: Testar Login

1. Acesse: http://localhost:8080/auth/admin-login
2. Use:
   - Email: `admin@teste.com`
   - Senha: `Admin123!`
3. Deve redirecionar para o dashboard sem erros

---

## 🔍 Explicação Técnica

### O que é RLS?

RLS (Row Level Security) é um sistema de segurança do PostgreSQL/Supabase que controla **quais linhas** um usuário pode acessar em uma tabela.

### Por que acontece o erro?

Quando você habilita RLS em uma tabela:
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

**TODA query SELECT é bloqueada** por padrão, a menos que exista uma **política** explícita permitindo acesso.

### Como funciona a política correta?

```sql
CREATE POLICY "users_can_view_own_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

Traduzindo:
- **Nome:** `users_can_view_own_roles`
- **Tabela:** `user_roles`
- **Operação:** `SELECT` (leitura)
- **Quem:** Usuários autenticados (`authenticated`)
- **Condição:** Só pode ver sua própria role (`auth.uid() = user_id`)

---

## ⚠️ Erros Comuns

### Erro 1: "relation 'user_roles' does not exist"
**Causa:** Tabela não foi criada
**Solução:** Execute [MIGRATION_COMPLETA.sql](MIGRATION_COMPLETA.sql)

### Erro 2: "type 'app_role' does not exist"
**Causa:** Tipo ENUM não foi criado
**Solução:**
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
```

### Erro 3: "duplicate key value violates unique constraint"
**Causa:** Tentando inserir role duplicada
**Solução:** Delete a role antiga antes de inserir:
```sql
DELETE FROM user_roles WHERE user_id = '...';
INSERT INTO user_roles (user_id, role) VALUES ('...', 'admin');
```

### Erro 4: "new row violates row-level security policy"
**Causa:** Política RLS bloqueando INSERT
**Solução:** Adicionar política para INSERT (ou criar via SQL como service_role)

---

## 📋 Checklist de Verificação

Após executar a correção, verifique:

- [ ] Query de diagnóstico retorna dados do admin
- [ ] Políticas RLS aparecem em `pg_policies`
- [ ] Tipo ENUM `app_role` existe
- [ ] Constraint é `UNIQUE(user_id)` e não `UNIQUE(user_id, role)`
- [ ] Login funciona sem erro
- [ ] Redireciona para dashboard

---

## 🎓 Entendendo a Estrutura

### Fluxo do Login:

1. **Usuário preenche email/senha** → `Login.tsx`
2. **Supabase autentica** → `supabase.auth.signInWithPassword()`
3. **Login bem-sucedido** → Usuário autenticado
4. **Redireciona para dashboard** → `navigate('/admin/dashboard')`
5. **ProtectedRoute verifica role** → `useAuth.tsx`
6. **Query na tabela user_roles** → **AQUI FALHA se RLS não estiver correto**
7. **Se role = admin** → Mostra dashboard
8. **Se role = user** → Redireciona para `/student`

### Tabelas Envolvidas:

```
auth.users (gerenciado pelo Supabase)
    └─ profiles (dados do perfil)
         └─ user_roles (role: admin ou user)
```

---

## 🔐 Segurança

As políticas RLS garantem que:
- ✅ Cada usuário só vê **sua própria role**
- ✅ Não é possível ver roles de outros usuários
- ✅ Não é possível modificar roles via cliente (precisa ser via SQL)
- ✅ Admins não têm privilégios especiais no RLS (igualdade de segurança)

---

## 📞 Ainda com problemas?

Se após executar a correção o erro persistir:

1. Verifique o **console do navegador** (F12) para erros detalhados
2. Veja os **logs do Supabase** (Dashboard → Logs → Postgres)
3. Execute o diagnóstico novamente e me envie os resultados
4. Verifique se há **triggers** interferindo nas inserções

---

## 🎯 Resumo Rápido

**3 comandos para resolver:**

```sql
-- 1. Criar política RLS
CREATE POLICY "users_can_view_own_roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Garantir dados do admin
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, 'Admin Teste' FROM auth.users
WHERE email = 'admin@teste.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Admin Teste';

-- 3. Garantir role do admin
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@teste.com');
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@teste.com';
```

**Pronto!** Login deve funcionar agora. ✅
