# Backend - Node.js + Express

Backend da aplicação Comparador de Preços.

## 🚀 Tecnologias

- Node.js + Express
- PostgreSQL
- JWT (autenticação local)
- Passport.js (OAuth)
- Axios (API externa)
- Bcrypt (hash de senhas)

## 📁 Estrutura

```
backend/
├── config/
│   ├── db.js           # Conexão PostgreSQL
│   ├── passport.js     # Configuração OAuth
│   └── schema.sql      # Schema do banco
├── middleware/
│   └── auth.js         # Middleware de autenticação
├── routes/
│   ├── auth.js         # Rotas de autenticação
│   ├── produtos.js     # Rotas de produtos
│   └── favoritos.js    # Rotas de favoritos
├── server.js           # Servidor principal
├── package.json
└── .env                # Variáveis de ambiente
```

## ⚙️ Instalação

```bash
npm install
```

## 🔧 Configuração

Copie `.env.example` para `.env` e configure:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/comparador
JWT_SECRET=seu_token_secreto
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 🗄️ Banco de Dados

Execute o schema SQL:

```bash
psql -U postgres -d comparador -f config/schema.sql
```

## 🏃 Rodar

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

Servidor rodará em http://localhost:5000

## 📚 Endpoints

Ver documentação completa em [TESTES.md](../TESTES.md)

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `GET /api/auth/google` - OAuth Google
- `GET /api/auth/facebook` - OAuth Facebook

### Produtos
- `GET /api/produtos?busca=termo` - Pesquisar
- `GET /api/produtos/:id` - Detalhes
- `GET /api/produtos/usuario/historico` - Histórico

### Favoritos
- `GET /api/favoritos` - Listar
- `POST /api/favoritos` - Adicionar
- `DELETE /api/favoritos/:id` - Remover

## 🔐 Autenticação

Use o token JWT no header:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🌐 APIs Externas

- **Mercado Livre API**: https://api.mercadolibre.com/
  - Endpoint: `/sites/MLB/search?q=termo`
  - 100% gratuita, sem necessidade de chave

## 📦 Deploy

Ver [DEPLOY.md](../DEPLOY.md) para instruções completas.
