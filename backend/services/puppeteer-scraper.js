/**
 * Scraper com Puppeteer para sites JavaScript
 * Funciona com Worten, PCDiga e outros sites modernos
 */

// Cache do navegador para reutilizar
let browser = null;

async function getBrowser() {
  if (!browser) {
    const isProd = process.env.NODE_ENV === 'production';
    
    try {
      if (isProd) {
        // Produção (Render) - usar chromium otimizado com puppeteer-core
        const puppeteerCore = require('puppeteer-core');
        const chromium = require('@sparticuz/chromium');
        
        console.log('🔧 Iniciando Chromium serverless...');
        browser = await puppeteerCore.launch({
          args: [...chromium.args, '--disable-web-security'],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true
        });
        console.log('✅ Chromium iniciado com sucesso');
      } else {
        // Desenvolvimento - usar puppeteer normal
        const puppeteer = require('puppeteer');
        console.log('🔧 Iniciando Puppeteer local...');
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
        console.log('✅ Puppeteer iniciado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar navegador:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
  return browser;
}

/**
 * Scraper da PCBem (site WooCommerce)
 */
async function scrapePCBem(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = `https://www.pcbem.pt/?s=${encodeURIComponent(termo)}&post_type=product`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Aguardar produtos
    await page.waitForSelector('.product', { timeout: 10000 });
    
    let todosProdutos = [];
    const maxPaginas = 5; // Capturar até 5 páginas
    
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      console.log(`📄 PCBem - Página ${pagina}...`);
      
      // Extrair produtos da página atual
      const produtos = await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll('.product');
        
        cards.forEach(card => {
          try {
            const nomeEl = card.querySelector('.woocommerce-loop-product__title, h2, h3, .product-title');
            const precoEl = card.querySelector('.price, .amount, .woocommerce-Price-amount');
            const imagemEl = card.querySelector('img');
            const linkEl = card.querySelector('a');
            
            if (nomeEl && precoEl && linkEl?.href) {
              const nome = nomeEl.textContent.trim();
              const precoTexto = precoEl.textContent.trim();
              const precoLimpo = precoTexto
                .replace(/[^\d,]/g, '')
                .replace(/\./g, '')
                .replace(',', '.');
              const preco = parseFloat(precoLimpo) || 0;
              const imagem = imagemEl?.src || imagemEl?.getAttribute('data-src') || imagemEl?.getAttribute('data-lazy-src');
              const url = linkEl.href;
              
              // ID único baseado na URL
              const idUnico = url.split('/').pop() || url.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
              
              if (nome && preco > 0 && preco < 20000) {
                items.push({
                  nome,
                  preco,
                  preco_original: preco * 1.1,
                  url: url.startsWith('http') ? url : `https://www.pcbem.pt${url}`,
                  imagem: imagem || 'https://via.placeholder.com/300',
                  loja: 'PCBem',
                  condicao: 'Novo',
                  disponibilidade: 'Disponível',
                  id_externo: `pcbem_${idUnico}`,
                  vendedor: 'PCBem'
                });
              }
            }
          } catch (err) {
            // Ignorar erros individuais
          }
        });
        
        return items;
      });
      
      todosProdutos = todosProdutos.concat(produtos);
      
      // Tentar clicar no botão "next" ou "próxima página"
      try {
        const botaoNext = await page.$('a.next, .next-page, .pagination-next, a[rel="next"]');
        if (!botaoNext) {
          console.log('  Sem mais páginas');
          break; // Não há mais páginas
        }
        
        await botaoNext.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar carregar
        await page.waitForSelector('.product', { timeout: 5000 });
      } catch (err) {
        console.log('  Fim da paginação');
        break; // Erro ao clicar ou carregar próxima página
      }
    }
    
    console.log(`✅ PCBem: ${todosProdutos.length} produtos encontrados (${maxPaginas} páginas)`);
    return todosProdutos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape PCBem:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scraper da Radio Popular (site com JavaScript)
 */
async function scrapeRadioPopular(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = `https://www.radiopopular.pt/pesquisa/${encodeURIComponent(termo)}`;
    console.log(`🔗 URL Radio Popular: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Aguardar produtos (usar seletor genérico)
    console.log('⏳ Aguardando seletor .product...');
    await page.waitForSelector('.product', { timeout: 10000 });
    console.log('✓ Seletor encontrado!');
    
    let todosProdutos = [];
    const maxPaginas = 5;
    
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      console.log(`📄 Radio Popular - Página ${pagina}...`);
      
      const produtos = await page.evaluate(() => {
        const items = [];
        const debug = { total: 0, erros: [] };
        const cards = document.querySelectorAll('.product');
        
        debug.total = cards.length;
        
        cards.forEach((card, index) => {
          try {
            const links = card.querySelectorAll('a');
            let nome = null;
            let url = null;
            
            links.forEach(link => {
              if (!nome && link.textContent && link.textContent.trim().length > 10) {
                nome = link.textContent.trim();
                url = link.href;
              }
            });
            
            if (nome) {
              nome = nome.replace(/^\d+\s*-\s*/, '').trim();
            }
            
            const imagemEl = card.querySelector('img');
            if (nome && url) {
              // Buscar todos os preços no container e pegar o maior
              const textoCompleto = card.textContent;
              const todosPrecos = textoCompleto.match(/(\d+(?:[\s.]\d{3})*,\d+)\s*€/g) || [];
              let preco = 0;
              if (todosPrecos.length > 0) {
                const precosNumericos = todosPrecos.map(p => {
                  const match = p.match(/(\d+(?:[\s.]\d{3})*,\d+)/);
                  if (match) {
                    const precoLimpo = match[1].replace(/[\s.]/g, '').replace(',', '.');
                    return parseFloat(precoLimpo);
                  }
                  return 0;
                }).filter(p => p > 0 && p < 20000);
                preco = Math.max(...precosNumericos);
              }
              const imagem = imagemEl?.src || imagemEl?.getAttribute('data-src') || imagemEl?.getAttribute('data-lazy-src');
              const idUnico = url.split('/').pop() || url.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
              if (preco > 0) {
                items.push({
                  nome,
                  preco,
                  preco_original: preco * 1.1,
                  url: url.startsWith('http') ? url : `https://www.radiopopular.pt${url}`,
                  imagem: imagem || 'https://via.placeholder.com/300',
                  loja: 'Radio Popular',
                  condicao: 'Novo',
                  disponibilidade: 'Disponível',
                  id_externo: `radiopopular_${idUnico}`,
                  vendedor: 'Radio Popular'
                });
              }
            }
          } catch (err) {
            // Ignorar
          }
        });
        
        return items;
      });
      
      todosProdutos = todosProdutos.concat(produtos);
      console.log(`  ${produtos.length} produtos nesta página`);
      
      // Tentar ir para próxima página
      try {
        const nextBtn = await page.$('a.next, .pagination-next, [rel="next"], button.next');
        if (!nextBtn) break;
        
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.waitForSelector('.product', { timeout: 5000 });
      } catch (err) {
        console.log('  Fim da paginação');
        break;
      }
    }
    
    console.log(`✅ Radio Popular: ${todosProdutos.length} produtos encontrados (${maxPaginas} páginas)`);
    return todosProdutos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape Radio Popular:', error.message);
    console.error('Stack:', error.stack);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scraper da Chip7
 */
async function scrapeChip7(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = `https://chip7.pt/?main.query=${encodeURIComponent(termo)}`;
    console.log(`🔗 URL Chip7: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    console.log('⏳ Aguardando produtos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const produtos = await page.evaluate(() => {
      const items = [];
      
      // Procurar por todos os elementos que contenham preços
      const todosElementos = Array.from(document.querySelectorAll('*'));
      const produtosEncontrados = [];
      
      // Agrupar elementos por proximidade (produtos ficam próximos)
      // Procurar por containers maiores que contenham produtos
      todosElementos.forEach(el => {
        const texto = el.textContent;
        // Verificar se tem preço em formato europeu e tamanho adequado
        if (texto && texto.match(/\d+[\s.]*\d+,\d+€/) && el.children.length > 2 && el.children.length < 30) {
          produtosEncontrados.push(el);
        }
      });
      
      // Para cada elemento com preço, buscar informações próximas
      produtosEncontrados.forEach(produtoEl => {
        try {
          // Buscar o nome (geralmente está acima do preço)
          let nome = null;
          let url = null;
          
          // Procurar links próximos que possam conter o nome
          const linksProximos = produtoEl.querySelectorAll('a') || 
                                produtoEl.parentElement?.querySelectorAll('a') ||
                                produtoEl.parentElement?.parentElement?.querySelectorAll('a');
          
          if (linksProximos && linksProximos.length > 0) {
            for (const link of linksProximos) {
              const textoLink = link.textContent.trim();
              if (textoLink && textoLink.length > 10 && !textoLink.includes('€')) {
                nome = textoLink;
                url = link.href;
                break;
              }
            }
          }
          
          // Buscar TODOS os preços no container e pegar o maior (geralmente o correto)
          const textoCompleto = produtoEl.textContent;
          const todosPrecos = textoCompleto.match(/(\d+(?:[\s.]\d{3})*,\d+)\s*€/g) || [];
          
          let preco = 0;
          if (todosPrecos.length > 0) {
            // Converter todos os preços e pegar o maior
            const precosNumericos = todosPrecos.map(p => {
              const match = p.match(/(\d+(?:[\s.]\d{3})*,\d+)/);
              if (match) {
                const precoLimpo = match[1].replace(/[\s.]/g, '').replace(',', '.');
                return parseFloat(precoLimpo);
              }
              return 0;
            }).filter(p => p > 0 && p < 50000); // Filtrar preços válidos
            
            // Pegar o maior preço (geralmente é o preço real, não o desconto)
            preco = Math.max(...precosNumericos);
          }
          
          // Buscar imagem
          const imgProxima = produtoEl.querySelector('img') || 
                            produtoEl.parentElement?.querySelector('img') ||
                            produtoEl.parentElement?.parentElement?.querySelector('img');
          const imagem = imgProxima?.src || imgProxima?.getAttribute('data-src');
          
          if (nome && preco > 0 && url) {
            // Criar ID único baseado na URL do produto
            const idUnico = url.split('/').pop() || url.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
            
            items.push({
              nome,
              preco,
              preco_original: preco * 1.1,
              url: url.startsWith('http') ? url : `https://chip7.pt${url}`,
              imagem: imagem || 'https://via.placeholder.com/300',
              loja: 'Chip7',
              condicao: 'Novo',
              disponibilidade: 'Disponível',
              id_externo: `chip7_${idUnico}`,
              vendedor: 'Chip7'
            });
          }
        } catch (err) {
          // Ignorar erros individuais
        }
      });
      
      // Remover duplicados (mesmo id_externo, nome e preço)
      const unicos = [];
      const vistos = new Set();
      items.forEach(item => {
        const chave = `${item.id_externo}_${item.nome}_${item.preco}`;
        if (!vistos.has(chave)) {
          vistos.add(chave);
          unicos.push(item);
        }
      });
      
      return unicos;
    });
    
    console.log(`✅ Chip7: ${produtos.length} produtos encontrados`);
    return produtos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape Chip7:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scraper da PCDiga
 */
async function scrapePCDiga(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    let todosProdutos = [];
    const maxPaginas = 5;
    
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      console.log(`📄 PCDiga - Página ${pagina}...`);
      
      const url = pagina === 1 
        ? `https://www.pcdiga.com/search?query=${encodeURIComponent(termo)}`
        : `https://www.pcdiga.com/search?query=${encodeURIComponent(termo)}&page=${pagina}`;
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const produtos = await page.evaluate(() => {
        const items = [];
        
        // Pegar todos os links que parecem produtos (longos com categorias)
        const links = Array.from(document.querySelectorAll('a')).filter(a => {
          const texto = a.textContent.trim();
          const href = a.href;
          // Produtos têm textos longos e URLs completas
          return texto.length > 15 && 
                 href.includes('pcdiga.com/') && 
                 !href.includes('javascript:') &&
                 !href.includes('campanhas') &&
                 !href.includes('configurador') &&
                 href.split('/').length > 5;
        });
        
        links.forEach(link => {
          try {
            const nome = link.textContent.trim();
            const url = link.href;
            
            // Buscar preço próximo ao link (no container pai)
            const container = link.closest('div, article, section');
            if (!container) return;
            
            const textoContainer = container.textContent;
            // Buscar todos os preços no container e pegar o maior
            const todosPrecos = textoContainer.match(/(\d+(?:[\s.]\d{3})*,\d+)\s*€/g) || [];
            let preco = 0;
            if (todosPrecos.length > 0) {
              const precosNumericos = todosPrecos.map(p => {
                const match = p.match(/(\d+(?:[\s.]\d{3})*,\d+)/);
                if (match) {
                  const precoLimpo = match[1].replace(/[\s.]/g, '').replace(',', '.');
                  return parseFloat(precoLimpo);
                }
                return 0;
              }).filter(p => p > 0 && p < 100000);
              preco = Math.max(...precosNumericos);
            }
            // Buscar imagem próxima
            const img = container.querySelector('img');
            const imagem = img?.src || img?.getAttribute('data-src') || 'https://via.placeholder.com/300';
            // ID único baseado na URL
            const idUnico = url.split('/').pop() || url.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
            if (preco > 0 && preco < 100000) {
              items.push({
                nome,
                preco,
                preco_original: preco * 1.05,
                url,
                imagem,
                loja: 'PCDiga',
                condicao: 'Novo',
                disponibilidade: 'Disponível',
                id_externo: `pcdiga_${idUnico}`,
                vendedor: 'PCDiga'
              });
            }
          } catch (err) {
            // Ignorar erros
          }
        });
        
        // Remover duplicados
        const unicos = [];
        const vistos = new Set();
        items.forEach(item => {
          const chave = `${item.nome}_${item.preco}`;
          if (!vistos.has(chave)) {
            vistos.add(chave);
            unicos.push(item);
          }
        });
        
        return unicos;
      });
      
      console.log(`  ${produtos.length} produtos nesta página`);
      todosProdutos = todosProdutos.concat(produtos);
      
      // Verificar se tem próxima página (se retornou 0 produtos, parar)
      if (produtos.length === 0) {
        console.log('  Sem mais produtos');
        break;
      }
    }
    
    console.log(`✅ PCDiga: ${todosProdutos.length} produtos encontrados (${maxPaginas} páginas)`);
    return todosProdutos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape PCDiga:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scraper da GlobalData
 */
async function scrapeGlobalData(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    let todosProdutos = [];
    const maxPaginas = 5;
    
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      console.log(`📄 GlobalData - Página ${pagina}...`);
      
      const url = pagina === 1 
        ? `https://www.globaldata.pt/?query=${encodeURIComponent(termo)}`
        : `https://www.globaldata.pt/?query=${encodeURIComponent(termo)}&page=${pagina}`;
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const produtos = await page.evaluate(() => {
        const items = [];
        const articles = Array.from(document.querySelectorAll('article'));
        
        articles.forEach(article => {
          try {
            const links = Array.from(article.querySelectorAll('a'));
            
            // Link com nome de produto
            const linkProduto = links.find(l => {
              const href = l.href;
              const texto = l.textContent.trim();
              return href && 
                     texto.length > 15 && 
                     href.includes('globaldata.pt/') && 
                     !href.includes('img.globaldata') &&
                     !href.includes('produtos-saldos') &&
                     !href.includes('?query=');
            });
            
            if (!linkProduto) return;
            
            // Buscar todos os preços no container e pegar o maior
            const textoArticle = article.textContent;
            const todosPrecos = textoArticle.match(/(\d+(?:[\s.]\d{3})*,\d+)\s*€/g) || [];
            let preco = 0;
            if (todosPrecos.length > 0) {
              const precosNumericos = todosPrecos.map(p => {
                const match = p.match(/(\d+(?:[\s.]\d{3})*,\d+)/);
                if (match) {
                  const precoLimpo = match[1].replace(/[\s.]/g, '').replace(',', '.');
                  return parseFloat(precoLimpo);
                }
                return 0;
              }).filter(p => p > 0 && p < 50000);
              preco = Math.max(...precosNumericos);
            }
            if (preco <= 0 || preco > 50000) return;
            // Buscar imagem
            const img = article.querySelector('img');
            const imagem = img?.src || 'https://via.placeholder.com/300';
            // ID único baseado na URL
            const idUnico = linkProduto.href.split('/').pop() || linkProduto.href.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
            items.push({
              nome: linkProduto.textContent.trim(),
              preco,
              preco_original: preco * 1.05,
              url: linkProduto.href,
              imagem: imagem.includes('energy_labels') ? 'https://via.placeholder.com/300' : imagem,
              loja: 'GlobalData',
              condicao: 'Novo',
              disponibilidade: 'Disponível',
              id_externo: `globaldata_${idUnico}`,
              vendedor: 'GlobalData'
            });
          } catch (err) {
            // Ignorar erros individuais
          }
        });
        
        // Remover duplicados
        const unicos = [];
        const vistos = new Set();
        items.forEach(item => {
          if (!vistos.has(item.url)) {
            vistos.add(item.url);
            unicos.push(item);
          }
        });
        
        return unicos;
      });
      
      console.log(`  ${produtos.length} produtos nesta página`);
      todosProdutos = todosProdutos.concat(produtos);
      
      // Se não encontrou produtos, parar
      if (produtos.length === 0) {
        console.log('  Sem mais produtos');
        break;
      }
    }
    
    console.log(`✅ GlobalData: ${todosProdutos.length} produtos encontrados (${maxPaginas} páginas)`);
    return todosProdutos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape GlobalData:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scraper da Worten (site com JavaScript)
 */
async function scrapeWorten(termo) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navegar para página de busca
    const url = `https://www.worten.pt/search?query=${encodeURIComponent(termo)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar produtos carregarem (seletor correto: .product-card)
    await page.waitForSelector('.product-card', { timeout: 10000 });
    
    let todosProdutos = [];
    const maxPaginas = 5;
    
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      console.log(`📄 Worten - Página ${pagina}...`);
      
      const produtos = await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll('.product-card');
        
        cards.forEach(card => {
          try {
            const nomeEl = card.querySelector('h3, .product-name, .product-title, h2, h4');
            const precoEl = card.querySelector('.price, .product-price, [data-price]');
            const imagemEl = card.querySelector('img');
            const linkEl = card.querySelector('a');
            
            if (nomeEl && precoEl && linkEl?.href) {
              const nome = nomeEl.textContent.trim();
              const precoTexto = precoEl.textContent.trim();
              // Buscar todos os preços no container e pegar o maior
              const textoCompleto = precoEl.parentElement?.textContent || precoTexto;
              const todosPrecos = textoCompleto.match(/(\d+(?:[\s.]\d{3})*,\d+)\s*€/g) || [];
              let preco = 0;
              if (todosPrecos.length > 0) {
                const precosNumericos = todosPrecos.map(p => {
                  const match = p.match(/(\d+(?:[\s.]\d{3})*,\d+)/);
                  if (match) {
                    const precoLimpo = match[1].replace(/[\s.]/g, '').replace(',', '.');
                    return parseFloat(precoLimpo);
                  }
                  return 0;
                }).filter(p => p > 0 && p < 20000);
                preco = Math.max(...precosNumericos);
              }
              const imagem = imagemEl?.src || imagemEl?.getAttribute('data-src') || imagemEl?.getAttribute('data-lazy-src');
              const url = linkEl.href;
              // ID único baseado na URL
              const idUnico = url.split('/').pop() || url.split('?').pop() || `prod_${Math.random().toString(36).substr(2, 9)}`;
              if (nome && preco > 0 && preco < 20000) {
                items.push({
                  nome,
                  preco,
                  preco_original: preco * 1.1,
                  url: url.startsWith('http') ? url : `https://www.worten.pt${url}`,
                  imagem: imagem || 'https://via.placeholder.com/300',
                  loja: 'Worten',
                  condicao: 'Novo',
                  disponibilidade: 'Disponível',
                  id_externo: `worten_${idUnico}`,
                  vendedor: 'Worten'
                });
              }
            }
          } catch (err) {
            // Ignorar
          }
        });
        
        return items;
      });
      
      todosProdutos = todosProdutos.concat(produtos);
      console.log(`  ${produtos.length} produtos nesta página`);
      
      // Tentar ir para próxima página
      try {
        const nextBtn = await page.$('button[aria-label="Next"], .pagination-next, a[rel="next"], button.next');
        if (!nextBtn) {
          console.log('  Sem mais páginas');
          break;
        }
        
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.waitForSelector('.product-card', { timeout: 5000 });
      } catch (err) {
        console.log('  Fim da paginação');
        break;
      }
    }
    
    console.log(`✅ Worten: ${todosProdutos.length} produtos encontrados (${maxPaginas} páginas)`);
    return todosProdutos;
    
  } catch (error) {
    console.error('❌ Erro ao scrape Worten:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Buscar em todas as lojas com Puppeteer
 */
async function buscarComPuppeteer(termo) {
  const resultados = {};
  
  try {
    // Buscar em paralelo para ser mais rápido
    const [produtosWorten, produtosRadioPopular, produtosPCBem, produtosChip7, produtosPCDiga, produtosGlobalData] = await Promise.all([
      scrapeWorten(termo).catch(err => { console.log('Worten falhou'); return []; }),
      scrapeRadioPopular(termo).catch(err => { console.log('Radio Popular falhou'); return []; }),
      scrapePCBem(termo).catch(err => { console.log('PCBem falhou'); return []; }),
      scrapeChip7(termo).catch(err => { console.log('Chip7 falhou'); return []; }),
      scrapePCDiga(termo).catch(err => { console.log('PCDiga falhou'); return []; }),
      scrapeGlobalData(termo).catch(err => { console.log('GlobalData falhou'); return []; })
    ]);
    
    if (produtosWorten.length > 0) {
      resultados.worten = {
        loja: 'Worten',
        quantidade: produtosWorten.length,
        produtos: produtosWorten
      };
    }
    
    if (produtosRadioPopular.length > 0) {
      resultados.radiopopular = {
        loja: 'Radio Popular',
        quantidade: produtosRadioPopular.length,
        produtos: produtosRadioPopular
      };
    }
    
    if (produtosPCBem.length > 0) {
      resultados.pcbem = {
        loja: 'PCBem',
        quantidade: produtosPCBem.length,
        produtos: produtosPCBem
      };
    }
    
    if (produtosChip7.length > 0) {
      resultados.chip7 = {
        loja: 'Chip7',
        quantidade: produtosChip7.length,
        produtos: produtosChip7
      };
    }
    
    if (produtosPCDiga.length > 0) {
      resultados.pcdiga = {
        loja: 'PCDiga',
        quantidade: produtosPCDiga.length,
        produtos: produtosPCDiga
      };
    }
    
    if (produtosGlobalData.length > 0) {
      resultados.globaldata = {
        loja: 'GlobalData',
        quantidade: produtosGlobalData.length,
        produtos: produtosGlobalData
      };
    }
    
  } catch (error) {
    console.error('Erro geral no scraping:', error);
  }
  
  return resultados;
}

/**
 * Fechar navegador ao terminar
 */
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Limpar navegador ao fechar o processo
process.on('exit', closeBrowser);
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);

module.exports = {
  scrapeWorten,
  scrapeRadioPopular,
  scrapePCBem,
  scrapeChip7,
  scrapePCDiga,
  scrapeGlobalData,
  buscarComPuppeteer,
  closeBrowser
};
