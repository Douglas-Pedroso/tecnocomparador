const puppeteer = require('puppeteer');

async function debugChip7() {
  console.log('🔍 Debugando estrutura de preços da Chip7...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📄 Navegando para busca de portáteis...');
    await page.goto('https://chip7.pt/?main.query=portatil', { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    
    console.log('⏳ Aguardando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Análise detalhada da estrutura dos preços
    const analise = await page.evaluate(() => {
      const resultados = [];
      
      // Pegar todos os elementos que contêm texto com €
      const todosElementos = Array.from(document.querySelectorAll('*'));
      const elementosComPreco = todosElementos.filter(el => {
        const texto = el.textContent;
        return texto && texto.includes('€') && el.children.length < 15;
      });
      
      // Agrupar por área (procurar containers de produtos)
      const containersAnalisados = new Set();
      
      elementosComPreco.forEach(el => {
        // Subir na hierarquia até encontrar um container maior
        let container = el;
        for (let i = 0; i < 5; i++) {
          if (container.parentElement) {
            container = container.parentElement;
          }
        }
        
        // Evitar analisar o mesmo container várias vezes
        const containerId = container.outerHTML.substring(0, 100);
        if (containersAnalisados.has(containerId)) return;
        containersAnalisados.add(containerId);
        
        // Buscar todos os preços dentro deste container
        const textoCompleto = container.textContent;
        const precosEncontrados = textoCompleto.match(/\d+[\s.]*\d*,\d+\s*€/g) || [];
        
        // Buscar nome do produto (links com texto longo)
        const links = Array.from(container.querySelectorAll('a'));
        let nomeProduto = null;
        for (const link of links) {
          const texto = link.textContent.trim();
          if (texto.length > 20 && !texto.includes('€')) {
            nomeProduto = texto;
            break;
          }
        }
        
        if (nomeProduto && precosEncontrados.length > 0) {
          resultados.push({
            nome: nomeProduto.substring(0, 80),
            precos: precosEncontrados,
            textoCompleto: textoCompleto.substring(0, 200)
          });
        }
      });
      
      return resultados.slice(0, 10); // Primeiros 10 produtos
    });
    
    console.log('\n📦 Análise de produtos encontrados:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    analise.forEach((item, i) => {
      console.log(`${i + 1}. ${item.nome}`);
      console.log(`   Preços encontrados: ${item.precos.join(' | ')}`);
      console.log(`   Contexto: ${item.textoCompleto.substring(0, 100)}...`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
}

debugChip7();
