const axios = require('axios');
const cheerio = require('cheerio');

// Configurações das lojas dos Açores - São Miguel
const LOJAS_CONFIG = {
  pcbem: {
    nome: 'PCBem',
    baseUrl: 'https://www.pcbem.pt',
    searchUrl: 'https://www.pcbem.pt/pesquisa?q=',
    selectors: {
      produto: '.product-item',
      nome: '.product-name',
      preco: '.product-price',
      imagem: '.product-image img',
      url: '.product-link'
    }
  },
  chip7: {
    nome: 'Chip7',
    baseUrl: 'https://www.chip7.pt',
    searchUrl: 'https://www.chip7.pt/search?q=',
    selectors: {
      produto: '.product',
      nome: 'h2.title',
      preco: '.price',
      imagem: 'img.product-img',
      url: 'a.product-url'
    }
  },
  worten: {
    nome: 'Worten',
    baseUrl: 'https://www.worten.pt',
    searchUrl: 'https://www.worten.pt/search?query=',
    selectors: {
      produto: '.w-product',
      nome: '.w-product__title',
      preco: '.w-product__price',
      imagem: '.w-product__img',
      url: '.w-product__link'
    }
  },
  radiopopular: {
    nome: 'Radio Popular',
    baseUrl: 'https://www.radiopopular.pt',
    searchUrl: 'https://www.radiopopular.pt/pesquisa?term=',
    selectors: {
      produto: '.product-card',
      nome: '.product-title',
      preco: '.product-price',
      imagem: '.product-thumbnail',
      url: '.product-link'
    }
  }
};

/**
 * Faz scraping de uma loja específica
 * NOTA: Os seletores CSS precisam ser ajustados para cada loja
 * Use ferramentas como Chrome DevTools para inspecionar os sites
 */
async function scrapeLoja(lojaId, termo) {
  const config = LOJAS_CONFIG[lojaId];
  if (!config) {
    throw new Error(`Loja ${lojaId} não configurada`);
  }

  try {
    const url = `${config.searchUrl}${encodeURIComponent(termo)}`;
    
    // Headers para simular navegador real
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const produtos = [];

    $(config.selectors.produto).each((index, element) => {
      try {
        const nome = $(element).find(config.selectors.nome).text().trim();
        const precoTexto = $(element).find(config.selectors.preco).text().trim();
        const imagem = $(element).find(config.selectors.imagem).attr('src') || $(element).find(config.selectors.imagem).attr('data-src');
        const urlProduto = $(element).find(config.selectors.url).attr('href');

        // Extrair preço (formato: 199,99 € ou 199.99€)
        const precoMatch = precoTexto.match(/(\d+[\.,]?\d*)/);
        const preco = precoMatch ? parseFloat(precoMatch[1].replace(',', '.')) : 0;

        if (nome && preco > 0) {
          produtos.push({
            nome,
            preco,
            preco_original: preco * 1.1, // Simular preço original
            url: urlProduto?.startsWith('http') ? urlProduto : `${config.baseUrl}${urlProduto}`,
            imagem: imagem?.startsWith('http') ? imagem : `${config.baseUrl}${imagem}`,
            loja: config.nome,
            condicao: 'Novo',
            disponibilidade: 'Disponível'
          });
        }
      } catch (err) {
        console.error(`Erro ao processar produto em ${config.nome}:`, err.message);
      }
    });

    return produtos;
  } catch (error) {
    console.error(`Erro ao fazer scraping de ${config.nome}:`, error.message);
    return [];
  }
}

/**
 * Busca em todas as lojas configuradas
 */
async function buscarTodasLojas(termo) {
  const resultados = {};
  
  const promessas = Object.keys(LOJAS_CONFIG).map(async (lojaId) => {
    try {
      const produtos = await scrapeLoja(lojaId, termo);
      resultados[lojaId] = {
        loja: LOJAS_CONFIG[lojaId].nome,
        quantidade: produtos.length,
        produtos: produtos
      };
    } catch (error) {
      console.error(`Erro ao buscar em ${lojaId}:`, error.message);
      resultados[lojaId] = {
        loja: LOJAS_CONFIG[lojaId].nome,
        quantidade: 0,
        produtos: [],
        erro: error.message
      };
    }
  });

  await Promise.all(promessas);
  return resultados;
}

/**
 * Gera dados mock para demonstração (enquanto ajusta os scrapers)
 */
function gerarDadosMock(termo) {
  const produtos = {
    'ryzen 7': [
      { nome: 'AMD Ryzen 7 5800X 8-Core 3.8GHz', preco: 299.99, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' },
      { nome: 'AMD Ryzen 7 5700X 8-Core 3.4GHz', preco: 249.90, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' },
      { nome: 'AMD Ryzen 7 7700X 8-Core 4.5GHz', preco: 349.99, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' },
      { nome: 'AMD Ryzen 7 5800X3D 8-Core 3.4GHz', preco: 379.90, loja: 'Radio Popular', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' },
      { nome: 'AMD Ryzen 7 7800X3D 8-Core 4.2GHz', preco: 449.90, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' },
      { nome: 'AMD Ryzen 7 5800X Box', preco: 289.99, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop' }
    ],
    'rtx 4060': [
      { nome: 'ASUS GeForce RTX 4060 8GB Dual', preco: 339.99, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'MSI GeForce RTX 4060 8GB Ventus', preco: 349.90, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'Gigabyte RTX 4060 8GB Eagle', preco: 329.99, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'Zotac RTX 4060 8GB Twin Edge', preco: 334.90, loja: 'Radio Popular', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'ASUS ROG Strix RTX 4060 8GB OC', preco: 369.99, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'Gigabyte Gaming OC RTX 4060 8GB', preco: 344.90, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' },
      { nome: 'Palit RTX 4060 8GB StormX', preco: 324.99, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=300&h=300&fit=crop' }
    ],
    'notebook': [
      { nome: 'Lenovo IdeaPad Gaming 3 Ryzen 5 RTX 3050', preco: 799.99, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop' },
      { nome: 'ASUS TUF Gaming A15 Ryzen 7 RTX 4050', preco: 999.90, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&h=300&fit=crop' },
      { nome: 'HP Pavilion Gaming i5 GTX 1650', preco: 749.90, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=300&h=300&fit=crop' },
      { nome: 'Acer Nitro 5 i7 RTX 3060', preco: 1199.99, loja: 'Radio Popular', imagem: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=300&fit=crop' },
      { nome: 'MSI Katana GF66 i7 RTX 4060', preco: 1349.90, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=300&fit=crop' },
      { nome: 'Lenovo Legion 5 i5 RTX 4050', preco: 1099.99, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop' }
    ],
    'monitor': [
      { nome: 'ASUS TUF Gaming 24" FHD 165Hz', preco: 189.99, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop' },
      { nome: 'LG UltraGear 27" QHD 144Hz', preco: 299.90, loja: 'Chip7', imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop' },
      { nome: 'Samsung Odyssey G5 27" QHD', preco: 279.90, loja: 'Worten', imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop' },
      { nome: 'AOC Gaming 24" FHD 144Hz', preco: 149.99, loja: 'Radio Popular', imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop' },
      { nome: 'BenQ MOBIUZ 27" QHD 165Hz', preco: 349.90, loja: 'PCBem', imagem: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop' }
    ]
  };

  const termoLower = termo.toLowerCase();
  let produtosEncontrados = [];

  for (const [key, items] of Object.entries(produtos)) {
    if (termoLower.includes(key) || key.includes(termoLower)) {
      produtosEncontrados = items;
      break;
    }
  }

  // Agrupar por loja
  const resultados = {};
  produtosEncontrados.forEach((p, index) => {
    const lojaId = p.loja.toLowerCase().replace(/\s+/g, '');
    if (!resultados[lojaId]) {
      resultados[lojaId] = {
        loja: p.loja,
        quantidade: 0,
        produtos: []
      };
    }
    resultados[lojaId].quantidade++;
    resultados[lojaId].produtos.push({
      ...p,
      id_externo: `mock_${lojaId}_${Date.now()}_${index}`,
      preco_original: p.preco * 1.15,
      url: null, // null para indicar modo demo
      imagem: p.imagem || 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=300&h=300&fit=crop',
      condicao: 'Novo',
      disponibilidade: 'Disponível'
    });
  });

  return resultados;
}

module.exports = {
  buscarTodasLojas,
  scrapeLoja,
  gerarDadosMock,
  LOJAS_CONFIG
};
