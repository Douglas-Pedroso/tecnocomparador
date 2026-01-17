# Guia de Deploy - Comparador de Preços

## 🎯 Objetivo

Deploy 100% gratuito:
- **Backend:** Render
- **Frontend:** GitHub Pages ou Vercel
- **Banco de dados:** ElephantSQL ou Supabase

---

## 📦 Backend no Render

### 1. Preparar repositório

Certifique-se que seu código está no GitHub:

```bash
git add .
git commit -m "Preparando para deploy"
git push origin main
```

### 2. Criar conta no Render

1. Acesse [render.com](https://render.com/)
2. Crie conta (pode usar GitHub)

### 3. Criar Web Service

1. Dashboard > "New +" > "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name:** comparador-backend
   - **Region:** escolha mais próximo
   - **Branch:** main
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### 4. Adicionar variáveis de ambiente

Na seção "Environment Variables", adicione:

```
DATABASE_URL=sua_database_url_elephantsql
JWT_SECRET=seu_token_secreto_production
GOOGLE_CLIENT_ID=seu_google_id (se usar OAuth)
GOOGLE_CLIENT_SECRET=seu_google_secret
FACEBOOK_APP_ID=seu_facebook_id
FACEBOOK_APP_SECRET=seu_facebook_secret
FRONTEND_URL=https://seu-usuario.github.io/comparador
NODE_ENV=production
```

### 5. Deploy

Clique em "Create Web Service" e aguarde o deploy (5-10 min).

Sua URL será: `https://comparador-backend.onrender.com`

### ⚠️ Importante: Cold Start

O plano gratuito do Render hiberna após 15 min de inatividade. 

**Solução:** Adicionar loading no frontend enquanto backend "acorda" (já implementado no código!).

---

## 🌐 Frontend no GitHub Pages

### 1. Configurar package.json

Edite `frontend/package.json`:

```json
{
  "homepage": "https://seu-usuario.github.io/comparador"
}
```

### 2. Criar .env de produção

Crie `frontend/.env.production`:

```env
REACT_APP_API_URL=https://comparador-backend.onrender.com
```

### 3. Deploy

```bash
cd frontend
npm run deploy
```

Seu site estará em: `https://seu-usuario.github.io/comparador`

### Atualizar depois

```bash
npm run deploy
```

---

## 🚀 Alternativa: Frontend no Vercel

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
cd frontend
vercel
```

Siga as instruções:
- Setup and deploy? Yes
- Which scope? Sua conta
- Link to existing project? No
- Project name? comparador-frontend
- In which directory is your code? ./
- Override settings? No

### 3. Configurar variável de ambiente

```bash
vercel env add REACT_APP_API_URL
# Cole: https://comparador-backend.onrender.com
# Environment: Production
```

### 4. Deploy produção

```bash
vercel --prod
```

Seu site estará em: `https://comparador-frontend.vercel.app`

### Atualizar depois

```bash
vercel --prod
```

---

## 🗄️ Banco de Dados (ElephantSQL)

### 1. Criar conta

1. Acesse [elephantsql.com](https://www.elephantsql.com/)
2. Crie conta gratuita
3. Create New Instance
4. Plan: Tiny Turtle (Free)
5. Name: comparador-db
6. Region: escolha mais próximo
7. Create instance

### 2. Obter URL de conexão

1. Clique na instância criada
2. Copie a URL (seção Details)
3. Cole no `DATABASE_URL` do Render

### 3. Criar tabelas

1. Vá na aba "Browser"
2. Copie o conteúdo de `backend/config/schema.sql`
3. Cole e execute

Ou use um cliente SQL como [pgAdmin](https://www.pgadmin.org/) ou [DBeaver](https://dbeaver.io/).

---

## ✅ Checklist Pós-Deploy

- [ ] Backend acessível (teste: `https://seu-backend.onrender.com`)
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] Pesquisa de produtos funcionando
- [ ] Favoritos funcionando
- [ ] OAuth configurado (se usar)

---

## 🔄 Atualizações

### Backend (Render)

Render detecta automaticamente commits no GitHub:

```bash
git add .
git commit -m "Atualização"
git push
```

Deploy automático em 2-5 minutos.

### Frontend (GitHub Pages)

```bash
cd frontend
npm run deploy
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

---

## 📊 Monitoramento

### Logs do Backend (Render)

1. Dashboard Render > Seu serviço
2. Aba "Logs"
3. Acompanhe requests e erros

### Analytics (Opcional)

Adicione [Google Analytics](https://analytics.google.com/):

1. Crie propriedade
2. Copie Measurement ID
3. Adicione no `frontend/public/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎉 Pronto!

Seu comparador de preços está no ar! 

**URLs Finais:**
- Frontend: `https://seu-usuario.github.io/comparador`
- Backend: `https://comparador-backend.onrender.com`
- Banco: ElephantSQL Dashboard

**Compartilhe:**
- LinkedIn
- GitHub (adicione no README)
- Portfólio pessoal
