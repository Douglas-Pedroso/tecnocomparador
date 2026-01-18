require('dotenv').config();
const { buscarComPuppeteer } = require('./services/puppeteer-scraper');
const { Pool } = require('pg');

// Conexão com o banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Salva ou atualiza produtos no banco de dados
 */
async function salvarProdutos(produtos, loja) {
  const client = await pool.connect();
  let salvos = 0;
  let atualizados = 0;

  try {
    for (const produto of produtos) {
      // Verifica se o produto já existe
      const existente = await client.query(
        'SELECT id, preco FROM produtos WHERE produto_id_externo = $1 AND loja = $2',
        [produto.id_externo, loja]
      );

      if (existente.rows.length > 0) {
        // Atualiza produto existente
        await client.query(
          `UPDATE produtos 
           SET nome = $1, url = $2, preco = $3, preco_original = $4, 
               imagem = $5, condicao = $6, disponibilidade = $7, 
               vendedor = $8, atualizado_em = CURRENT_TIMESTAMP
           WHERE produto_id_externo = $9 AND loja = $10`,
          [
            produto.nome,
            produto.url,
            produto.preco,
            produto.preco_original || produto.preco,
            produto.imagem,
            produto.condicao || 'Novo',
            produto.disponibilidade || 'Disponível',
            produto.vendedor || loja,
            produto.id_externo,
            loja
          ]
        );
        atualizados++;
      } else {
        // Insere novo produto
        await client.query(
          `INSERT INTO produtos 
           (produto_id_externo, nome, url, preco, preco_original, loja, 
            imagem, condicao, disponibilidade, vendedor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            produto.id_externo,
            produto.nome,
            produto.url,
            produto.preco,
            produto.preco_original || produto.preco,
            loja,
            produto.imagem,
            produto.condicao || 'Novo',
            produto.disponibilidade || 'Disponível',
            produto.vendedor || loja
          ]
        );
        salvos++;
      }
    }
  } finally {
    client.release();
  }

  return { salvos, atualizados };
}

/**
 * Remove produtos antigos (mais de 7 dias sem atualização)
 */
async function limparProdutosAntigos() {
  const client = await pool.connect();
  try {
    const resultado = await client.query(
      `DELETE FROM produtos 
       WHERE atualizado_em < NOW() - INTERVAL '7 days' 
       AND id NOT IN (SELECT produto_id FROM favoritos)`
    );
    return resultado.rowCount;
  } finally {
    client.release();
  }
}

/**
 * Função principal que roda os scrapers e salva no banco
 */
async function atualizarBaseDados(termo = 'notebook') {
  console.log('🚀 Iniciando atualização da base de dados...');
  console.log(`📦 Termo de busca: "${termo}"`);
  console.log('⏰ Horário:', new Date().toLocaleString('pt-PT'));
  console.log('─────────────────────────────────────\n');

  try {
    // Executa os scrapers
    console.log('🔍 Executando web scraping...');
    const resultados = await buscarComPuppeteer(termo);

    let totalSalvos = 0;
    let totalAtualizados = 0;
    let totalProdutos = 0;

    // Processa cada loja
    for (const [lojaId, dados] of Object.entries(resultados)) {
      const produtos = dados.produtos || [];
      const nomeLoja = dados.loja || lojaId;
      
      // FILTRAR PRODUTOS MOCK - NÃO SALVAR NO BANCO
      const produtosReais = produtos.filter(p => 
        p.id_externo && !p.id_externo.startsWith('mock_')
      );
      
      if (produtosReais.length > 0) {
        console.log(`\n📦 ${nomeLoja}: ${produtosReais.length} produtos`);
        const { salvos, atualizados } = await salvarProdutos(produtosReais, nomeLoja);
        console.log(`   ✅ ${salvos} novos | 🔄 ${atualizados} atualizados`);
        
        totalSalvos += salvos;
        totalAtualizados += atualizados;
        totalProdutos += produtosReais.length;
      } else {
        console.log(`\n⚠️  ${nomeLoja}: Nenhum produto real encontrado (ignorando mock)`);
      }
    }

    // Limpa produtos antigos
    console.log('\n🧹 Limpando produtos antigos...');
    const removidos = await limparProdutosAntigos();
    console.log(`   🗑️  ${removidos} produtos removidos\n`);

    // Resumo final
    console.log('─────────────────────────────────────');
    console.log('✅ Atualização concluída!');
    console.log(`📊 Total: ${totalProdutos} produtos processados`);
    console.log(`   • ${totalSalvos} novos`);
    console.log(`   • ${totalAtualizados} atualizados`);
    console.log(`   • ${removidos} removidos`);
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro na atualização:', erro);
    process.exit(1);
  }
}

// Permite passar termo de busca como argumento
// Uso: node scrape-and-save.js notebook
const termo = process.argv[2] || 'notebook';
atualizarBaseDados(termo);
