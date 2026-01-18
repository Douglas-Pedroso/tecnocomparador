require('dotenv').config();
const { buscarComPuppeteer } = require('./services/puppeteer-scraper');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function salvarProdutos(produtos, loja) {
  const client = await pool.connect();
  let salvos = 0;
  let atualizados = 0;

  try {
    for (const produto of produtos) {
      const existente = await client.query(
        'SELECT id FROM produtos WHERE produto_id_externo = $1 AND loja = $2',
        [produto.id_externo, loja]
      );

      if (existente.rows.length > 0) {
        await client.query(
          `UPDATE produtos 
           SET nome = $1, url = $2, preco = $3, preco_original = $4, 
               imagem = $5, atualizado_em = CURRENT_TIMESTAMP
           WHERE produto_id_externo = $6 AND loja = $7`,
          [produto.nome, produto.url, produto.preco,
           produto.preco_original || produto.preco,
           produto.imagem, produto.id_externo, loja]
        );
        atualizados++;
      } else {
        await client.query(
          `INSERT INTO produtos 
           (produto_id_externo, nome, url, preco, preco_original, loja, 
            imagem, condicao, disponibilidade, vendedor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [produto.id_externo, produto.nome, produto.url,
           produto.preco, produto.preco_original || produto.preco,
           loja, produto.imagem, produto.condicao || 'Novo',
           produto.disponibilidade || 'Disponível', produto.vendedor || loja]
        );
        salvos++;
      }
    }
  } finally {
    client.release();
  }
  return { salvos, atualizados };
}

async function atualizarTermo(termo) {
  console.log(`\n🔍 Buscando "${termo}"...`);
  
  try {
    const resultados = await buscarComPuppeteer(termo);
    let totalSalvos = 0, totalAtualizados = 0, totalProdutos = 0;

    for (const [lojaId, dados] of Object.entries(resultados)) {
      const produtos = dados.produtos || [];
      const nomeLoja = dados.loja || lojaId;
      
      const produtosReais = produtos.filter(p => 
        p.id_externo && !p.id_externo.startsWith('mock_')
      );
      
      if (produtosReais.length > 0) {
        const { salvos, atualizados } = await salvarProdutos(produtosReais, nomeLoja);
        console.log(`   📦 ${nomeLoja}: ${salvos} novos | ${atualizados} atualizados`);
        totalSalvos += salvos;
        totalAtualizados += atualizados;
        totalProdutos += produtosReais.length;
      }
    }
    return { salvos: totalSalvos, atualizados: totalAtualizados, total: totalProdutos };
  } catch (erro) {
    console.error(`   ❌ Erro:`, erro.message);
    return { salvos: 0, atualizados: 0, total: 0 };
  }
}

async function main() {
  console.log('\n🚀 Atualização Rápida - TOP 20 Categorias');
  console.log('⏰ Horário:', new Date().toLocaleString('pt-PT'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TOP 20 categorias mais buscadas
  const categorias = [
    'portátil',
    'telemóvel',
    'televisão',
    'tablet',
    'smartwatch',
    'headphones',
    'teclado',
    'rato',
    'monitor',
    'impressora',
    'frigorífico',
    'máquina lavar roupa',
    'aspirador',
    'ar condicionado',
    'câmara',
    'consola',
    'router',
    'SSD',
    'powerbank',
    'coluna bluetooth'
  ];

  let totalGeralSalvos = 0, totalGeralAtualizados = 0, totalGeralProdutos = 0;

  for (const categoria of categorias) {
    const resultado = await atualizarTermo(categoria);
    totalGeralSalvos += resultado.salvos;
    totalGeralAtualizados += resultado.atualizados;
    totalGeralProdutos += resultado.total;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Atualização concluída!');
  console.log(`📊 Total: ${totalGeralProdutos} produtos`);
  console.log(`   • ${totalGeralSalvos} novos`);
  console.log(`   • ${totalGeralAtualizados} atualizados`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
  process.exit(0);
}

main().catch(erro => {
  console.error('❌ Erro:', erro);
  process.exit(1);
});
