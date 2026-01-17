# Guia de Instalação - Comparador de Preços

## 📋 Pré-requisitos

- Node.js 16+ instalado
- PostgreSQL instalado (ou conta no [ElephantSQL](https://www.elephantsql.com/) / [Supabase](https://supabase.com/) - gratuito)
- Git instalado

## 🚀 Instalação Completa

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd comparador
```

### 2. Instalar todas as dependências

```bash
npm run install-all
```

Ou manualmente:

```bash
# Raiz
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurar PostgreSQL

#### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb comparador

# Ou via psql
psql -U postgres
CREATE DATABASE comparador;
\q
```

#### Opção B: ElephantSQL (Gratuito, recomendado)

1. Acesse [elephantsql.com](https://www.elephantsql.com/)
2. Crie uma conta gratuita
3. Crie uma nova instância (Tiny Turtle - Free)
4. Copie a URL de conexão

#### Opção C: Supabase (Gratuito)

1. Acesse [supabase.com](https://supabase.com/)
2. Crie um projeto
3. Vá em Settings > Database
4. Copie a Connection String

### 4. Configurar Backend

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/comparador
JWT_SECRET=seu_token_super_secreto_aqui_123456

# OAuth (opcional - deixe em branco se não for usar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Criar tabelas no banco

```bash
# Opção 1: Via psql
psql -U postgres -d comparador -f config/schema.sql

# Opção 2: Copiar e colar no pgAdmin ou no SQL Editor do Supabase
# Abra o arquivo config/schema.sql e execute o SQL
```

### 6. Configurar Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 7. Rodar o projeto

#### Opção A: Rodar tudo junto (recomendado)

```bash
# Na pasta raiz
npm run dev
```

Isso vai rodar:
- Backend na porta 5000
- Frontend na porta 3000

#### Opção B: Rodar separadamente

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### 8. Acessar aplicação

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Configurar OAuth (Opcional)

### Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Vá em "APIs & Services" > "Credentials"
4. Criar credenciais > OAuth 2.0 Client ID
5. Adicione URLs autorizadas:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://seu-backend.onrender.com/api/auth/google/callback` (produção)
6. Copie Client ID e Client Secret para o `.env`

### Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app
3. Adicione "Facebook Login" ao app
4. Configure Valid OAuth Redirect URIs:
   - `http://localhost:5000/api/auth/facebook/callback`
   - `https://seu-backend.onrender.com/api/auth/facebook/callback`
5. Copie App ID e App Secret para o `.env`

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
# Windows
pg_ctl status

# Linux/Mac
sudo systemctl status postgresql
```

### Erro "Cannot find module"

```bash
# Reinstalar dependências
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Porta já em uso

```bash
# Mudar porta no backend/.env
PORT=5001

# Mudar porta do React (criar arquivo .env no frontend)
PORT=3001
```

## 📚 Próximos passos

- ✅ Testar login/registro
- ✅ Testar pesquisa de produtos
- ✅ Testar favoritos
- 🚀 Deploy (ver DEPLOY.md)
