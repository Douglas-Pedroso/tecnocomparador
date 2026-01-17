# Frontend - React App

Este é o frontend do Comparador de Preços, desenvolvido em React.

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm start

# Build para produção
npm run build
```

## 📦 Deploy no GitHub Pages

1. Configure o `homepage` no `package.json`:
```json
"homepage": "https://seu-usuario.github.io/seu-repositorio"
```

2. Instale gh-pages (já está no package.json):
```bash
npm install
```

3. Faça o build e deploy:
```bash
npm run deploy
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:5000
```

Para produção, altere para a URL do seu backend no Render.

## 📁 Estrutura

```
src/
├── components/    # Componentes reutilizáveis
├── pages/        # Páginas da aplicação
├── context/      # Context API (autenticação)
├── services/     # Serviços e API
├── App.js        # Componente principal
└── index.js      # Entry point
```
