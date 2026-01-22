require('dotenv').config();
const { buscarComPuppeteer } = require('./services/puppeteer-scraper');

async function testarBusca() {
  console.log('\n🔍 Testando busca com código corrigido...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const termo = 'portátil lenovo';
  console.log(`📌 Termo de busca: "${termo}"\n`);
  
  try {
    const resultado = await buscarComPuppeteer(termo);
    
    console.log('📊 RESULTADOS DA BUSCA:\n');
    
    let totalProdutos = 0;
    
    // Mostrar resultados por loja
    for (const [loja, dados] of Object.entries(resultado)) {
      if (dados.quantidade > 0) {
        console.log(`\n${dados.loja}:`);
        console.log(`  📦 ${dados.quantidade} produtos encontrados`);
        
        // Mostrar primeiros 3 produtos de cada loja
        console.log(`  Exemplos:`);
        dados.produtos.slice(0, 3).forEach((p, i) => {
          console.log(`    ${i + 1}. ${p.nome}`);
          console.log(`       💰 ${parseFloat(p.preco).toFixed(2)}€`);
          console.log(`       🔗 ${p.url.substring(0, 80)}...`);
        });
        
        // Verificar se há duplicatas (mesmo nome)
        const nomes = dados.produtos.map(p => p.nome);
        const nomesUnicos = new Set(nomes);
        if (nomes.length !== nomesUnicos.size) {
          console.log(`  ⚠️ ATENÇÃO: ${nomes.length - nomesUnicos.size} duplicatas detectadas!`);
        } else {
          console.log(`  ✅ Sem duplicatas`);
        }
        
        // Verificar preços suspeitos
        const precosSuspeitos = dados.produtos.filter(p => p.preco > 20000 || p.preco < 10);
        if (precosSuspeitos.length > 0) {
          console.log(`  ⚠️ ATENÇÃO: ${precosSuspeitos.length} produtos com preços suspeitos`);
          precosSuspeitos.forEach(p => {
            console.log(`     - ${p.nome}: ${p.preco}€`);
          });
        } else {
          console.log(`  ✅ Preços parecem OK`);
        }
        
        totalProdutos += dados.quantidade;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ TOTAL: ${totalProdutos} produtos encontrados\n`);
    
    if (totalProdutos === 0) {
      console.log('⚠️ Nenhum produto encontrado. Tente outro termo de busca.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar busca:', error.message);
    console.error(error.stack);
  }
  
  process.exit();
}

testarBusca();
