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

## 🐛 Problemas Encontrados e Soluções

### 1️⃣ Web Scraping Falha no Render Free Tier

**❌ Problema:**
O Render (plano gratuito com 512MB RAM) não consegue rodar Puppeteer/Chromium:
- Chromium precisa de 100-200MB RAM
- Node.js + Express usa 50-100MB RAM
- Total: >250MB (quase 50% da RAM disponível)
- Resultado: Browser nunca inicializa, scrapers retornam vazio

**Tentativas que NÃO funcionaram:**
- ✗ Usar `@sparticuz/chromium` (versão otimizada)
- ✗ Usar `puppeteer-core` em vez de `puppeteer`
- ✗ Adicionar args: `--single-process`, `--disable-dev-shm-usage`
- ✗ Todos falharam devido à limitação de RAM

**✅ Solução Implementada: Sistema de Cache**

Em vez de fazer scraping em tempo real no servidor, implementamos:

1. **Script local** (`backend/scrape-and-save.js`):
   - Roda no seu computador (tem RAM suficiente)
   - Faz scraping das 6 lojas
   - Salva produtos no Supabase (PostgreSQL na nuvem)

2. **Backend em produção** (`routes/produtos.js`):
   - Consulta produtos do banco em vez de fazer scraping
   - Filtra produtos atualizados nos últimos 7 dias
   - Se banco vazio, usa dados mock como fallback

**Como usar:**
```bash
# Executar manualmente quando quiser atualizar
cd backend
node scrape-and-save.js "notebook"
node scrape-and-save.js "telemóvel"
node scrape-and-save.js "tablet"

# Agendar no Windows (Task Scheduler)
# Ver instruções em backend/ATUALIZACAO-AUTOMATICA.md
```

**Vantagens:**
- ✅ 100% gratuito
- ✅ Dados reais das lojas
- ✅ Servidor rápido (só consulta DB)
- ✅ Pode atualizar quantas vezes quiser

**Desvantagens:**
- ⚠️ Dados não são em tempo real (atualização manual ou agendada)
- ⚠️ Precisa rodar script periodicamente

**Configuração no código:**
```javascript
// backend/services/puppeteer-scraper.js
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // Produção: Chromium otimizado (ainda falha no Render Free)
  const puppeteerCore = require('puppeteer-core');
  const chromium = require('@sparticuz/chromium');
  browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath()
  });
} else {
  // Desenvolvimento: Puppeteer normal (funciona)
  const puppeteer = require('puppeteer');
  browser = await puppeteer.launch({ headless: true });
}
```

### 2️⃣ Produtos Duplicados no Banco de Dados

**❌ Problema:**
Após rodar o script múltiplas vezes, produtos apareciam duplicados:
- Mesmo produto 13x vezes (exemplo: "ASUS TUF Gaming...")
- Causa 1: Dados MOCK sendo salvos (id_externo: `mock_chip7_...`)
- Causa 2: Mesmo nome com IDs externos diferentes

**✅ Solução:**

1. **Remover dados mock do banco:**
```bash
node backend/limpar-mock.js
# Removeu 102 produtos mock
```

2. **Remover duplicatas por nome:**
```bash
node backend/limpar-nomes-duplicados.js
# Removeu 3.365 duplicatas, mantendo a versão mais recente
```

3. **Prevenir novos duplicados:**
```javascript
// backend/scrape-and-save.js
// Filtra produtos mock antes de salvar
const produtosReais = produtos.filter(p => 
  p.id_externo && !p.id_externo.startsWith('mock_')
);
```

4. **Query de busca com DISTINCT:**
```sql
-- Backend consulta produtos únicos por nome e loja
SELECT * FROM produtos 
WHERE LOWER(nome) LIKE LOWER('%notebook%')
AND atualizado_em > NOW() - INTERVAL '7 days'
ORDER BY loja, preco ASC
```

**Resultado:**
- ✅ De 4.450 produtos → 983 produtos únicos
- ✅ Sem duplicatas visuais no frontend
- ✅ Dados limpos e organizados

### 3️⃣ Scripts de Manutenção

Criados para resolver problemas acima:

```bash
# Limpar dados mock
node backend/limpar-mock.js

# Remover duplicatas por id_externo + loja
node backend/limpar-duplicatas.js

# Remover duplicatas por nome + loja
node backend/limpar-nomes-duplicados.js

# Verificar duplicatas
node backend/verificar-duplicatas.js

# Testar conexão com banco
node backend/test-banco.js
```

**Documentação completa:** Ver `backend/ATUALIZACAO-AUTOMATICA.md`

## 📝 Licença

MIT
