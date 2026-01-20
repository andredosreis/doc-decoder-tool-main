# Alternativas de Banco de Dados

## 🎯 Banco de Dados Atual: Lovable Cloud (Supabase/PostgreSQL)

Este projeto usa **Lovable Cloud**, que é baseado em Supabase (PostgreSQL) com recursos adicionais:
- ✅ PostgreSQL completo
- ✅ Autenticação integrada
- ✅ Armazenamento de arquivos
- ✅ Edge Functions (serverless)
- ✅ Realtime subscriptions
- ✅ Row Level Security (RLS)

## 🔄 Como Migrar para Outro Banco de Dados

### Opção 1: Manter Supabase (Recomendado para MVP)
**Prós:**
- Já está integrado
- Grátis até 500MB
- Realtime out-of-the-box
- Autenticação pronta
- Fácil escalabilidade

**Contras:**
- Vendor lock-in moderado
- Limites no plano gratuito

### Opção 2: Firebase (Google)
**Quando usar:** Apps com muita sincronização em tempo real

**Passos para migração:**
1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Instalar SDK: `npm install firebase`
3. Substituir todas as chamadas de:
```typescript
// ANTES (Supabase)
import { supabase } from "@/integrations/supabase/client";
const { data } = await supabase.from('products').select();

// DEPOIS (Firebase)
import { db } from "@/config/firebase";
import { collection, getDocs } from "firebase/firestore";
const snapshot = await getDocs(collection(db, 'products'));
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**Arquivo de configuração:** `src/config/firebase.ts`

### Opção 3: MongoDB Atlas
**Quando usar:** Dados não relacionais, estrutura flexível

**Passos para migração:**
1. Criar cluster no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Backend necessário (Node.js API)
3. Não pode rodar direto no browser (requer API intermediária)

**Estrutura sugerida:**
```
/api
  /routes
    products.js
    users.js
  /models
    Product.js
    User.js
  server.js
```

### Opção 4: MySQL/PostgreSQL Próprio
**Quando usar:** Controle total, infraestrutura própria

**Requisitos:**
- Servidor backend (Node.js/Express)
- Servidor de banco (AWS RDS, DigitalOcean, etc.)
- API REST ou GraphQL

**Exemplo de API REST:**
```typescript
// Backend (Node.js/Express)
app.get('/api/products', async (req, res) => {
  const products = await db.query('SELECT * FROM products');
  res.json(products);
});

// Frontend (React)
const response = await fetch('/api/products');
const products = await response.json();
```

### Opção 5: PlanetScale (MySQL Serverless)
**Quando usar:** MySQL com experiência similar ao Supabase

**Características:**
- Serverless MySQL
- Branches de banco (como Git)
- Escala automática
- Interface web moderna

## 📋 Checklist de Migração

Ao trocar de banco de dados, você precisa reimplementar:

### 1. Autenticação
- [ ] Sistema de login/registro
- [ ] Recuperação de senha
- [ ] Sessões de usuário
- [ ] Tokens JWT

**Arquivos a modificar:**
- `src/components/Auth/LoginForm.tsx`
- `src/components/Auth/SignupForm.tsx`
- `src/contexts/AuthContext.tsx`

### 2. CRUD de Dados
- [ ] Criar registros
- [ ] Ler/listar registros
- [ ] Atualizar registros
- [ ] Deletar registros

**Padrão atual (Supabase):**
```typescript
// Ver: src/services/database.service.ts
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('app_id', appId);
```

**Substituir por:** Chamadas HTTP ao seu backend

### 3. Upload de Arquivos
**Atual:** Supabase Storage
```typescript
// src/services/storage.service.ts
await supabase.storage
  .from('products')
  .upload(filePath, file);
```

**Alternativas:**
- AWS S3 + CloudFront
- Cloudinary
- Google Cloud Storage
- UploadCare

### 4. Realtime (Opcional)
**Atual:** Supabase Realtime
```typescript
supabase
  .channel('products')
  .on('postgres_changes', { event: '*', schema: 'public' }, callback)
  .subscribe();
```

**Alternativas:**
- Pusher
- Ably
- Socket.io (requer backend)
- Firebase Realtime Database

## 🎯 Recomendação

Para este projeto (plataforma de cursos), **mantenha o Lovable Cloud** porque:

1. ✅ Autenticação já configurada
2. ✅ Armazenamento de vídeos/PDFs pronto
3. ✅ Edge Functions para webhooks de pagamento
4. ✅ RLS para segurança dos dados de clientes
5. ✅ Sem necessidade de servidor backend separado
6. ✅ Deploy automático

**Quando migrar?**
- Quando ultrapassar 500MB de dados (upgrade para plano pago)
- Se precisar de features específicas de outro banco
- Se quiser hospedar em infraestrutura própria

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [PlanetScale Docs](https://planetscale.com/docs)
