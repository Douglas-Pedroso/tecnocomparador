# 🔧 Guia de Web Scraping - Comparador de Preços

## 📋 Visão Geral

Este projeto agora suporta **web scraping real** das lojas de tecnologia dos Açores (São Miguel). O sistema busca produtos diretamente nos sites das lojas e organiza os resultados de forma intuitiva.

## 🏪 Lojas Configuradas

- **PCBem** - Loja local de tecnologia
- **Chip7** - Especializada em informática
- **Worten** - Grande cadeia portuguesa
- **Radio Popular** - Eletrónica e tecnologia

## 🚀 Como Funciona

### 1. Nova Interface de Busca

Quando você pesquisa por um produto (ex: "ryzen 7"), o sistema:

1. **Busca em todas as lojas** simultaneamente
2. **Mostra primeiro as lojas** com a quantidade de produtos encontrados
3. Você **clica na loja** para ver os produtos
4. **Ordena produtos** por preço, nome, etc.

### 2. Fluxo da Aplicação

```
Página Inicial
    ↓ (usuário pesquisa)
Página de Lojas (lista de lojas com quantidade)
    ↓ (usuário clica em uma loja)
Lista de Produtos (com ordenação)
```

## ⚙️ Configuração do Web Scraping

### Status Atual: **MODO DEMONSTRAÇÃO** 🎭

Por enquanto, o sistema usa **dados mock** (demonstração) porque:
- Cada loja tem estrutura HTML diferente
- É preciso ajustar os **seletores CSS** para cada site
- Algumas lojas podem ter proteção anti-bot

### Como Ativar o Scraping Real

#### Passo 1: Inspecionar os Sites

Para cada loja, você precisa descobrir os seletores CSS corretos:

```bash
# 1. Abra o site da loja no navegador
# 2. Pressione F12 (DevTools)
# 3. Use a ferramenta de seleção (ícone de seta)
# 4. Clique em um produto para ver o HTML
# 5. Anote os seletores CSS
```

#### Passo 2: Atualizar Configurações

Edite o arquivo `backend/services/scraper.js`:

```javascript
const LOJAS_CONFIG = {
  pcbem: {
    nome: 'PCBem',
    baseUrl: 'https://www.pcbem.pt',
    searchUrl: 'https://www.pcbem.pt/pesquisa?q=',
    selectors: {
      produto: '.product-item',      // ← Ajustar aqui
      nome: '.product-name',          // ← Ajustar aqui
      preco: '.product-price',        // ← Ajustar aqui
      imagem: '.product-image img',   // ← Ajustar aqui
      url: '.product-link'            // ← Ajustar aqui
    }
  }
  // ... outras lojas
};
```

#### Passo 3: Ativar Scraping Real

No arquivo `backend/routes/produtos.js`, linha ~90:

```javascript
// ANTES (mock):
const resultados = gerarDadosMock(termo);

// DEPOIS (scraping real):
const { buscarTodasLojas } = require('../services/scraper');
const resultados = await buscarTodasLojas(termo);
```

## 🛠️ Exemplo de Configuração

### Exemplo: PCDiga

Vamos supor que o site da PCDiga tem esta estrutura HTML:

```html
<div class="produto-card">
  <h3 class="titulo">AMD Ryzen 7 5800X</h3>
  <span class="preco-atual">€299,99</span>
  <img src="imagem.jpg" class="foto-produto">
  <a href="/produto/123" class="link-detalhes">Ver mais</a>
</div>
```

A configuração seria:

```javascript
pcdiga: {
  nome: 'PCDiga',
  baseUrl: 'https://www.pcdiga.com',
  searchUrl: 'https://www.pcdiga.com/search?q=',
  selectors: {
    produto: '.produto-card',
    nome: '.titulo',
    preco: '.preco-atual',
    imagem: '.foto-produto',
    url: '.link-detalhes'
  }
}
```

## 🔍 Testando o Scraper

### Teste Individual de Uma Loja

```javascript
// No Node.js REPL ou em um script de teste
const { scrapeLoja } = require('./backend/services/scraper');

async function testar() {
  const produtos = await scrapeLoja('pcbem', 'ryzen 7');
  console.log('Produtos encontrados:', produtos);
}

testar();
```

### Teste Completo

```javascript
const { buscarTodasLojas } = require('./backend/services/scraper');

async function testarTudo() {
  const resultados = await buscarTodasLojas('rtx 4060');
  console.log('Resultados por loja:', resultados);
}

testarTudo();
```

## ⚠️ Considerações Importantes

### Legalidade

- ✅ Web scraping é **legal** para dados públicos
- ⚠️ Respeite os **Termos de Serviço** das lojas
- ⚠️ Alguns sites **proíbem** scraping explicitamente
- ✅ **Alternativa**: Entre em contato com as lojas para parcerias/APIs

### Limitações Técnicas

- **Rate Limiting**: Sites podem bloquear muitas requisições
- **Captchas**: Alguns sites têm proteção anti-bot
- **Mudanças de Layout**: Sites mudam e quebram os seletores
- **IP Blocks**: Uso excessivo pode resultar em bloqueio de IP

### Boas Práticas

1. **Respeite delays**: Adicione pausas entre requisições
2. **User-Agent realista**: O scraper já usa headers de navegador real
3. **Cache**: Salve resultados no banco para reduzir requisições
4. **Monitoramento**: Implemente logs para detectar quebras

## 🚦 Próximos Passos

### Opção 1: Ajustar Scrapers (Recomendado)

1. Inspecionar cada site manualmente
2. Atualizar seletores CSS no `scraper.js`
3. Testar cada loja individualmente
4. Ativar scraping real no `produtos.js`

### Opção 2: Usar Puppeteer (Avançado)

Para sites com JavaScript dinâmico:

```bash
npm install puppeteer
```

```javascript
const puppeteer = require('puppeteer');

async function scrapeComPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  
  const produtos = await page.evaluate(() => {
    // Extrair dados da página renderizada
  });
  
  await browser.close();
  return produtos;
}
```

### Opção 3: API Oficial (Ideal)

Entrar em contato com as lojas para:
- Parceria oficial
- Acesso a API de produtos
- Dados em tempo real e confiáveis

## 📊 Funcionalidades Implementadas

✅ **Interface de lojas** - Lista lojas com quantidade de produtos  
✅ **Ordenação de produtos** - Por preço, nome, etc.  
✅ **Navegação fluida** - Entre lojas e produtos  
✅ **Cache de produtos** - Salva no banco PostgreSQL  
✅ **Histórico de pesquisas** - Registra buscas dos usuários  
✅ **Modo demonstração** - Dados mock para testar sem scraping  

## 🎯 Testando Agora

1. Inicie os servidores: `npm run dev`
2. Acesse: http://localhost:3000
3. Pesquise por: **"ryzen 7"** ou **"rtx 4060"**
4. Veja a lista de lojas
5. Clique em uma loja para ver produtos
6. Teste a ordenação (menor preço, maior preço, nome)

## 📝 Notas Finais

- O sistema está **funcional** com dados de demonstração
- Para usar **dados reais**, siga os passos de configuração acima
- **Atenção legal**: Consulte os Termos de Serviço de cada loja
- **Alternativa recomendada**: Buscar parceria oficial com as lojas

---

**Desenvolvido para as lojas dos Açores - São Miguel** 🇵🇹
