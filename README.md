# 🛒 Tecnocomparador

Comparador de preços de produtos de tecnologia em lojas portuguesas. O sistema faz web scraping em tempo real em 6 lojas diferentes para encontrar os melhores preços.

## 🏪 Lojas Suportadas

- **Worten** - www.worten.pt
- **PCDiga** - www.pcdiga.com
- **Radio Popular** - www.radiopopular.pt
- **PCBem** - www.pcbem.pt
- **Chip7** - chip7.pt
- **GlobalData** - www.globaldata.pt

## 🚀 Tecnologias

- **Backend:** Node.js + Express + Puppeteer
- **Frontend:** React
- **Banco de Dados:** PostgreSQL (Supabase)
- **Web Scraping:** Puppeteer (Headless Chrome)
- **Autenticação:** JWT

## 📁 Estrutura do Projeto

```
comparador/
├── backend/          # API Node.js
├── frontend/         # React App
└── README.md
```

## ⚙️ Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd comparador
```

### 2. Instalar dependências
```bash
npm run install-all
```

### 3. Configurar Backend
Crie o arquivo `backend/.env` baseado no `.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:[senha]@[host].supabase.com:5432/postgres
JWT_SECRET=seu_token_secreto_aqui
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Configurar Banco de Dados
Execute os scripts SQL em `backend/config/schema.sql`

### 5. Rodar o projeto
```bash
# Desenvolvimento (backend + frontend simultâneos)
npm run dev

# Ou separadamente:
npm run server  # Backend na porta 5000
npm run client  # Frontend na porta 3000
```

## 🌐 Deploy

### Banco de Dados (Supabase)
1. Criar conta em [Supabase](https://supabase.com)
2. Criar novo projeto
3. Executar `backend/config/schema.sql` no SQL Editor
4. Copiar connection string

### Backend (Render)
1. Criar conta no [Render](https://render.com)
2. Conectar repositório GitHub
3. Configurar Web Service:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Adicionar variáveis de ambiente
5. Deploy automático

### Frontend (Vercel)
1. Criar conta em [Vercel](https://vercel.com)
2. Importar projeto do GitHub
3. Configurar:
   - **Framework:** Create React App
   - **Root Directory:** `frontend`
4. Adicionar variável: `REACT_APP_API_URL`
5. Deploy automático

## 📋 Funcionalidades

- ✅ Busca em tempo real com web scraping (Puppeteer)
- ✅ Comparação de preços em 6 lojas portuguesas
- ✅ Paginação automática (até 5 páginas por loja)
- ✅ Sistema de favoritos (requer login)
- ✅ Preços em euros (€)
- ✅ Exibição de descontos e preços originais
- ✅ Ordenação por preço e nome
- ✅ Interface moderna e responsiva
- ✅ Autenticação com JWT

## 🔗 Endpoints API

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login

### Busca
- `GET /api/buscar?termo=produto` - Buscar em todas as lojas

### Favoritos
- `GET /api/favoritos` - Listar favoritos do usuário
- `POST /api/favoritos` - Adicionar favorito
- `DELETE /api/favoritos/:id` - Remover favorito
- `DELETE /api/favoritos/produto/:produto_id` - Remover por produto

## ⚙️ Como Funciona o Web Scraping

O sistema utiliza **Puppeteer** (Headless Chrome) para fazer scraping em tempo real:

1. Usuário faz uma busca (ex: "notebook")
2. Backend inicia 6 scrapers em paralelo (Promise.all)
3. Cada scraper:
   - Acessa a loja com o termo de busca
   - Extrai produtos da página 1
   - Clica em "próxima página" e repete (até 5 páginas)
   - Remove duplicados
4. Resultados são agregados e retornados ao frontend
5. Produtos favoritos são salvos automaticamente no banco

### ⚠️ Limitações do Puppeteer em Ambientes Serverless

**Problema:** O Render (plano gratuito) não inclui Chromium por padrão, fazendo o scraping falhar.

**Solução Implementada:**
- Em **produção**: Usa `@sparticuz/chromium` (Chromium otimizado para serverless)
- Em **desenvolvimento**: Usa o Puppeteer normal com Chrome local

**Configuração no código:**
```javascript
// backend/services/puppeteer-scraper.js
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // Chromium otimizado para Render/Lambda
  browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath()
  });
} else {
  // Puppeteer normal para desenvolvimento
  browser = await puppeteer.launch({ headless: true });
}
```

**Dependências necessárias:**
```bash
npm install @sparticuz/chromium puppeteer-core
```

**Alternativas se o scraping continuar lento:**
- Migrar para plano pago do Render ($7/mês)
- Usar Railway ou Fly.io (melhor suporte a Puppeteer)
- Implementar cache de resultados
- Usar APIs oficiais das lojas (se disponíveis)

## 📝 Licença

MIT
