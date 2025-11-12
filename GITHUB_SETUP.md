# 🚀 Como Subir o Projeto para o GitHub

Este guia rápido mostra como criar um repositório no GitHub e fazer o push do projeto.

---

## ✅ Status Atual

- ✅ Repositório Git inicializado
- ✅ Commit inicial criado
- ✅ Documentação completa criada
- ✅ .gitignore configurado
- ✅ LICENSE adicionada

---

## 📋 Próximos Passos

### Opção 1: Usando a Interface Web do GitHub (Mais Fácil)

#### Passo 1: Criar Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha os dados:
   - **Repository name**: `plataforma-cursos-online` (ou nome de sua escolha)
   - **Description**: `Plataforma SaaS completa para criação e gestão de apps de cursos online`
   - **Visibility**:
     - ✅ **Public** (para ser público)
     - ⚠️ **Private** (para manter privado)
   - ❌ **NÃO marque** "Initialize this repository with a README"
   - ❌ **NÃO adicione** .gitignore ou license (já temos)
3. Clique em **"Create repository"**

#### Passo 2: Fazer Push do Código

Após criar o repositório, o GitHub mostrará comandos. Use estes comandos no terminal:

```bash
# Adicionar o remote do GitHub (substitua SEU-USUARIO pelo seu username)
git remote add origin https://github.com/SEU-USUARIO/plataforma-cursos-online.git

# Fazer push do código
git push -u origin main
```

**Exemplo:**
```bash
git remote add origin https://github.com/andredosreis/plataforma-cursos-online.git
git push -u origin main
```

---

### Opção 2: Usando GitHub CLI (Mais Rápido)

Se você tiver o GitHub CLI instalado:

```bash
# Instalar GitHub CLI (se não tiver)
# macOS: brew install gh
# Windows: winget install --id GitHub.cli
# Linux: Ver https://cli.github.com/

# Fazer login
gh auth login

# Criar repositório e fazer push
gh repo create plataforma-cursos-online --public --source=. --push

# OU para privado:
gh repo create plataforma-cursos-online --private --source=. --push
```

---

## 🔍 Verificar se Funcionou

Após o push, você deve ver:

```bash
Enumerating objects: 159, done.
Counting objects: 100% (159/159), done.
Delta compression using up to 8 threads
Compressing objects: 100% (151/151), done.
Writing objects: 100% (159/159), 1.23 MiB | 2.45 MiB/s, done.
Total 159 (delta 8), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (8/8), done.
To https://github.com/SEU-USUARIO/plataforma-cursos-online.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

Acesse seu repositório em:
```
https://github.com/SEU-USUARIO/plataforma-cursos-online
```

---

## 🎨 Customizar o Repositório

### 1. Adicionar Topics (Tags)

No GitHub, vá em **About** (lado direito) e adicione topics:
- `react`
- `typescript`
- `supabase`
- `saas`
- `education`
- `course-platform`
- `pwa`
- `tailwindcss`

### 2. Adicionar Descrição

Edite a descrição do repositório:
```
Plataforma SaaS completa para criação e gestão de aplicativos de cursos online, similar ao Hotmart/Kiwify
```

### 3. Adicionar URL do Site

Se você fizer deploy, adicione a URL do site no campo **Website**.

---

## 🔒 Tornar o Repositório Privado

Se você criou como público e quer tornar privado:

1. Vá em **Settings** (configurações do repositório)
2. Role até o final da página
3. Na seção **Danger Zone**, clique em **Change visibility**
4. Selecione **Make private**
5. Confirme digitando o nome do repositório

---

## 📝 Editar URLs no README

Após criar o repositório, edite o [README.md](README.md) para atualizar as URLs:

**Procure e substitua:**
- `seu-usuario` → Seu username do GitHub
- `doc-decoder-tool` → Nome do seu repositório

**Exemplo de URLs para atualizar:**

```markdown
# ANTES
git clone https://github.com/seu-usuario/doc-decoder-tool.git

# DEPOIS
git clone https://github.com/andredosreis/plataforma-cursos-online.git
```

**Fazer commit das alterações:**
```bash
git add README.md
git commit -m "docs: atualiza URLs do repositório no README"
git push
```

---

## 🌐 Configurar GitHub Pages (Opcional)

Se quiser hospedar a documentação:

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione **main** branch
3. Clique em **Save**
4. Seu site estará em: `https://seu-usuario.github.io/plataforma-cursos-online`

---

## 📊 Badges para o README

Depois de criar o repositório, você pode adicionar badges reais:

```markdown
![GitHub repo size](https://img.shields.io/github/repo-size/seu-usuario/plataforma-cursos-online)
![GitHub stars](https://img.shields.io/github/stars/seu-usuario/plataforma-cursos-online?style=social)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/plataforma-cursos-online?style=social)
```

---

## 🔄 Comandos Git Úteis

```bash
# Ver status dos arquivos
git status

# Ver histórico de commits
git log --oneline

# Ver repositórios remotos
git remote -v

# Fazer pull de alterações
git pull origin main

# Criar nova branch
git checkout -b feature/nova-feature

# Voltar para main
git checkout main

# Ver diferenças
git diff
```

---

## ⚠️ Importante: Segurança

Antes de fazer o push, verifique que **NÃO** estão sendo enviados:

- ❌ Arquivo `.env` (deve estar no .gitignore)
- ❌ `node_modules/` (deve estar no .gitignore)
- ❌ Chaves secretas do Supabase
- ❌ Tokens de API
- ❌ Senhas

**Para verificar:**
```bash
# Ver o que será enviado
git status

# Ver conteúdo do .gitignore
cat .gitignore
```

---

## 🆘 Problemas Comuns

### "Permission denied (publickey)"

**Solução:** Configure SSH ou use HTTPS:
```bash
# Trocar remote para HTTPS
git remote set-url origin https://github.com/SEU-USUARIO/plataforma-cursos-online.git
```

### "Repository not found"

**Solução:** Verifique se o nome do repositório está correto:
```bash
git remote -v
```

### "Updates were rejected"

**Solução:** Fazer pull primeiro:
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique a [documentação do Git](https://git-scm.com/doc)
2. Consulte a [documentação do GitHub](https://docs.github.com)
3. Abra uma issue no repositório

---

**Pronto para fazer o push!** 🚀
