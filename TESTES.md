# 🧪 Testando a API - Comparador de Preços

Use este guia para testar todos os endpoints da API.

## 🔧 Ferramentas

- [Postman](https://www.postman.com/) (recomendado)
- [Insomnia](https://insomnia.rest/)
- curl (linha de comando)
- Thunder Client (extensão VS Code)

---

## 🌐 Base URL

```
Desenvolvimento: http://localhost:5000
Produção: https://comparador-backend.onrender.com
```

---

## 1️⃣ Autenticação

### Registrar usuário

```http
POST /api/auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```

**Resposta esperada:**
```json
{
  "message": "Usuário criado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "123456"
}
```

### Obter dados do usuário

```http
GET /api/auth/me
Authorization: Bearer SEU_TOKEN_AQUI
```

### OAuth Google (navegador)

```
GET http://localhost:5000/api/auth/google
```

### OAuth Facebook (navegador)

```
GET http://localhost:5000/api/auth/facebook
```

---

## 2️⃣ Produtos

### Pesquisar produtos

```http
GET /api/produtos?busca=notebook gamer
```

**Parâmetros opcionais:**
- `ordenar`: preco, nome (default: preco)
- `ordem`: asc, desc (default: asc)
- `limite`: número de resultados (default: 20)

**Exemplo completo:**
```http
GET /api/produtos?busca=iphone&ordenar=preco&ordem=asc&limite=10
```

**Resposta:**
```json
{
  "message": "Produtos encontrados!",
  "produtos": [
    {
      "id": 1,
      "produto_id_externo": "MLB123456",
      "nome": "Notebook Gamer Acer Nitro 5",
      "preco": 4299.90,
      "preco_original": 5999.00,
      "url": "https://...",
      "imagem": "https://...",
      "loja": "Mercado Livre",
      "condicao": "Novo",
      "disponibilidade": "Disponível",
      "vendedor": "Loja Oficial"
    }
  ],
  "total": 20
}
```

### Detalhes de um produto

```http
GET /api/produtos/1
```

### Histórico de pesquisas (autenticado)

```http
GET /api/produtos/usuario/historico?limite=10
Authorization: Bearer SEU_TOKEN
```

---

## 3️⃣ Favoritos

⚠️ **Todos os endpoints requerem autenticação**

### Listar favoritos

```http
GET /api/favoritos
Authorization: Bearer SEU_TOKEN
```

### Adicionar favorito

```http
POST /api/favoritos
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "produto_id": 1
}
```

### Remover favorito por ID

```http
DELETE /api/favoritos/1
Authorization: Bearer SEU_TOKEN
```

### Remover favorito por produto_id

```http
DELETE /api/favoritos/produto/1
Authorization: Bearer SEU_TOKEN
```

---

## 📝 Exemplos com curl

### Registrar

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "123456"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "123456"
  }'
```

### Pesquisar produtos

```bash
curl "http://localhost:5000/api/produtos?busca=notebook"
```

### Adicionar favorito

```bash
curl -X POST http://localhost:5000/api/favoritos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"produto_id": 1}'
```

---

## 🧪 Sequência de testes recomendada

1. ✅ Health check: `GET /`
2. ✅ Registrar usuário
3. ✅ Fazer login (copiar token)
4. ✅ Obter dados do usuário com token
5. ✅ Pesquisar produtos
6. ✅ Adicionar produto aos favoritos
7. ✅ Listar favoritos
8. ✅ Remover favorito
9. ✅ Ver histórico de pesquisas

---

## 📋 Coleção Postman

Importe esta coleção no Postman:

1. Novo > Import
2. Cole este JSON:

```json
{
  "info": {
    "name": "Comparador de Preços",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nome\": \"João Silva\",\n  \"email\": \"joao@email.com\",\n  \"senha\": \"123456\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "url": { "raw": "{{baseUrl}}/api/auth/register" }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"joao@email.com\",\n  \"senha\": \"123456\"\n}",
              "options": { "raw": { "language": "json" } }
            },
            "url": { "raw": "{{baseUrl}}/api/auth/login" }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    }
  ]
}
```

---

## 🐛 Erros Comuns

### 401 Unauthorized
- Token expirado ou inválido
- Solução: Fazer login novamente

### 400 Bad Request
- Dados inválidos na requisição
- Verificar JSON e campos obrigatórios

### 500 Internal Server Error
- Erro no servidor
- Ver logs do backend

### CORS Error
- Backend não está aceitando requests do frontend
- Verificar `FRONTEND_URL` no `.env`
