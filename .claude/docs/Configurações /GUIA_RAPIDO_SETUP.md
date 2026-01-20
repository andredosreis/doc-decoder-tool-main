# 🚀 Guia Rápido de Setup - 15 Minutos

## ✅ O que já está configurado:

- ✅ Arquivo `.env` atualizado com suas credenciais
- ✅ `supabase/config.toml` atualizado com project_id correto
- ✅ Todas as migrations consolidadas em um único arquivo

---

## 📋 Checklist Rápido (Siga esta ordem)

### **PASSO 1: Aguardar Provisionamento do Supabase** ⏱️

1. Aguarde o provisionamento terminar (você verá o dashboard principal)
2. Você receberá um email de confirmação do Supabase

---

### **PASSO 2: Aplicar Migrations no Banco de Dados** 🗄️

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard/project/qdaorpyedwpcaaezsaxp

2. No menu lateral, clique em **SQL Editor**

3. Clique em **"New query"**

4. Abra o arquivo: `.claude/docs/Configurações /MIGRATION_COMPLETA.sql`

5. **Copie TODO o conteúdo** do arquivo e cole no SQL Editor

6. Clique em **"Run"** (ou Ctrl/Cmd + Enter)

7. ✅ Se aparecer "Success. No rows returned" → Perfeito! Avance para o próximo passo

8. ⚠️ Se aparecer algum erro:
   - Leia a mensagem de erro
   - Verifique se os buckets foram criados (veja PASSO 3)
   - Se necessário, execute as migrations em partes menores

---

### **PASSO 3: Criar Buckets de Storage** 📦

#### **Bucket 1: product-images**

1. No menu lateral do Supabase, clique em **Storage**
2. Clique em **"New bucket"**
3. Configurações:
   - **Name:** `product-images`
   - **Public:** ✅ **MARCAR COMO PÚBLICO**
   - **File size limit:** 50MB (ou deixe o padrão)
   - **Allowed MIME types:** deixe vazio (aceita todos)
4. Clique em **"Create bucket"**

#### **Bucket 2: module-content**

1. Clique em **"New bucket"** novamente
2. Configurações:
   - **Name:** `module-content`
   - **Public:** ✅ **MARCAR COMO PÚBLICO**
   - **File size limit:** 500MB (para vídeos)
   - **Allowed MIME types:** deixe vazio
3. Clique em **"Create bucket"**

**✅ Pronto! As políticas de acesso já foram configuradas pelas migrations.**

---

### **PASSO 4: Criar Primeiro Usuário Admin** 👤

#### Opção A: Via Interface (Recomendado)

1. **Reinicie o servidor de desenvolvimento** (importante para ler o novo `.env`):
   ```bash
   # Pressione Ctrl+C no terminal onde está rodando
   # Depois execute:
   npm run dev
   ```

2. Abra seu navegador em: `http://localhost:8080/auth/signup`

3. **Cadastre-se normalmente** com seus dados:
   - Nome completo
   - Email
   - Senha forte

4. Volte ao Supabase Dashboard → **SQL Editor**

5. Execute este SQL (substitua o email):
   ```sql
   -- Substitua 'seu@email.com' pelo email que você acabou de cadastrar
   UPDATE user_roles
   SET role = 'admin'
   WHERE user_id = (
     SELECT id FROM profiles WHERE email = 'seu@email.com'
   );
   ```

6. ✅ Pronto! Você agora é um admin.

#### Opção B: Via SQL (Direto)

Se preferir criar o admin diretamente pelo SQL:

```sql
-- Criar usuário admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_confirmed_at,
  recovery_token,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@exemplo.com',  -- ← MUDE AQUI
  crypt('SenhaForte123', gen_salt('bf')),  -- ← MUDE AQUI
  NOW(),
  '{"full_name": "Admin Principal"}',
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  'authenticated'
);

-- Atualizar para admin
UPDATE user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'admin@exemplo.com'
);
```

---

### **PASSO 5: Testar Tudo!** 🧪

1. **Teste 1: Login Admin**
   - Acesse: `http://localhost:8080/auth/admin-login`
   - Faça login com suas credenciais
   - Deve redirecionar para `/admin/dashboard`
   - ✅ Se conseguir acessar → Login funcionando!

2. **Teste 2: Criar Produto**
   - No painel admin, clique em **"Produtos"**
   - Clique em **"Novo Produto"**
   - Preencha os dados:
     - Título: "Curso Teste"
     - Descrição: "Teste de criação"
     - Preço: 97.00
   - Faça upload de uma imagem de thumbnail
   - Clique em **"Salvar"**
   - ✅ Se criar sem erros → CRUD funcionando!

3. **Teste 3: Verificar no Supabase**
   - Volte ao Supabase Dashboard
   - Clique em **Table Editor** → **products**
   - ✅ Se ver o produto criado → Banco funcionando!

4. **Teste 4: Upload de Arquivo**
   - No produto criado, clique em **"Módulos"**
   - Crie um novo módulo
   - Faça upload de um PDF ou vídeo
   - ✅ Se o upload funcionar → Storage funcionando!

---

## ⚠️ Troubleshooting

### Erro: "Invalid API Key"
**Solução:** Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Bucket not found"
**Solução:** Verifique se criou os 2 buckets no Storage

### Erro: "Permission denied"
**Solução:** Verifique se executou TODAS as migrations

### Não consigo fazer login como admin
**Solução:** Execute o SQL para atualizar a role para 'admin'

### Upload de arquivos falha
**Solução:** Verifique se os buckets estão marcados como **PUBLIC**

---

## 🎯 Próximos Passos (Depois de Testar)

Após confirmar que tudo está funcionando:

1. ✅ Criar mais produtos e módulos
2. ✅ Testar área do aluno (criar compra manual)
3. ✅ Personalizar cores do dashboard
4. ✅ Configurar integrações de pagamento (Hotmart, Kiwify, etc.)
5. ✅ Deploy das Edge Functions (webhooks, emails, certificados)

---

## 📞 Precisa de Ajuda?

1. Verifique o console do navegador (F12) para ver erros
2. Verifique os logs do Supabase: Dashboard → **Logs** → **Postgres**
3. Revise este guia passo a passo
4. Teste cada SQL individualmente se houver erros

---

**🎉 Parabéns! Seu sistema está pronto para uso!**
