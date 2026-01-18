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
      const existente = await client.query(
        'SELECT id, preco FROM produtos WHERE produto_id_externo = $1 AND loja = $2',
        [produto.id_externo, loja]
      );

      if (existente.rows.length > 0) {
        await client.query(
          `UPDATE produtos 
           SET nome = $1, url = $2, preco = $3, preco_original = $4, 
               imagem = $5, condicao = $6, disponibilidade = $7, 
               vendedor = $8, atualizado_em = CURRENT_TIMESTAMP
           WHERE produto_id_externo = $9 AND loja = $10`,
          [
            produto.nome, produto.url, produto.preco,
            produto.preco_original || produto.preco,
            produto.imagem, produto.condicao || 'Novo',
            produto.disponibilidade || 'Disponível',
            produto.vendedor || loja,
            produto.id_externo, loja
          ]
        );
        atualizados++;
      } else {
        await client.query(
          `INSERT INTO produtos 
           (produto_id_externo, nome, url, preco, preco_original, loja, 
            imagem, condicao, disponibilidade, vendedor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            produto.id_externo, produto.nome, produto.url,
            produto.preco, produto.preco_original || produto.preco,
            loja, produto.imagem, produto.condicao || 'Novo',
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
 * Atualiza produtos para um termo específico
 */
async function atualizarTermo(termo) {
  console.log(`\n🔍 Buscando "${termo}"...`);
  
  try {
    const resultados = await buscarComPuppeteer(termo);

    let totalSalvos = 0;
    let totalAtualizados = 0;
    let totalProdutos = 0;

    for (const [lojaId, dados] of Object.entries(resultados)) {
      const produtos = dados.produtos || [];
      const nomeLoja = dados.loja || lojaId;
      
      // Filtrar produtos mock
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
    console.error(`   ❌ Erro ao buscar "${termo}":`, erro.message);
    return { salvos: 0, atualizados: 0, total: 0 };
  }
}

/**
 * Função principal que atualiza múltiplas categorias
 */
async function atualizarCategorias() {
  console.log('\n🚀 Iniciando atualização de múltiplas categorias...');
  console.log('⏰ Horário:', new Date().toLocaleString('pt-PT'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TODAS as categorias de tecnologia e eletrodomésticos
  const categorias = [
    // Computadores e Portáteis
    'notebook',
    'portátil',
    'computador',
    'desktop',
    'all-in-one',
    
    // Componentes de PC
    'processador',
    'placa gráfica',
    'RAM',
    'motherboard',
    'SSD',
    'disco rígido',
    'fonte alimentação',
    'caixa PC',
    'cooler',
    'ventoinha',
    
    // Telemóveis e Tablets
    'telemóvel',
    'smartphone',
    'tablet',
    'ipad',
    'iphone',
    'samsung galaxy',
    
    // Televisões e Monitores
    'televisão',
    'TV',
    'smart TV',
    'monitor',
    'monitor gaming',
    'projetor',
    
    // Periféricos PC
    'teclado',
    'rato',
    'webcam',
    'microfone',
    'headset',
    'headphones',
    'auriculares',
    'colunas',
    'coluna bluetooth',
    'soundbar',
    'pen drive',
    'hub USB',
    'adaptador',
    
    // Impressoras e Scanners
    'impressora',
    'multifunções',
    'scanner',
    'tinta impressora',
    'toner',
    
    // Fotografia e Vídeo
    'câmara',
    'máquina fotográfica',
    'câmara vídeo',
    'gopro',
    'drone',
    'gimbal',
    'tripé',
    'cartão memória',
    
    // Gaming
    'consola',
    'playstation',
    'PS5',
    'xbox',
    'nintendo switch',
    'comando',
    'joystick',
    'volante gaming',
    'cadeira gaming',
    
    // Networking
    'router',
    'switch',
    'repetidor wifi',
    'access point',
    'powerline',
    
    // Smartwatches e Wearables
    'smartwatch',
    'smartband',
    'relógio inteligente',
    'pulseira atividade',
    
    // Acessórios Mobile
    'powerbank',
    'carregador',
    'cabo USB',
    'capa telemóvel',
    'película',
    'suporte carro',
    
    // Armazenamento
    'disco externo',
    'NAS',
    'pen USB',
    'cartão SD',
    
    // Áudio
    'earbuds',
    'airpods',
    'coluna portátil',
    'amplificador',
    'leitor CD',
    
    // Eletrodomésticos Grandes
    'frigorífico',
    'máquina lavar roupa',
    'máquina lavar loiça',
    'fogão',
    'forno',
    'micro-ondas',
    'exaustor',
    'arca congeladora',
    
    // Climatização
    'ar condicionado',
    'aquecedor',
    'desumidificador',
    'purificador ar',
    
    // Pequenos Eletrodomésticos
    'aspirador',
    'robot aspirador',
    'ferro engomar',
    'torradeira',
    'batedeira',
    'liquidificador',
    'cafeteira',
    'chaleira',
    'fritadeira ar',
    'processador alimentos',
    
    // Casa Inteligente
    'coluna inteligente',
    'alexa',
    'google home',
    'lâmpada inteligente',
    'tomada inteligente',
    'termostato',
    'fechadura inteligente',
    'campainha vídeo',
    'câmara vigilância',
    
    // Escritório
    'cadeira escritório',
    'secretária',
    'mesa digitalizadora',
    'calculadora',
    'destruidor papel',
    'plastificadora'
  ];

  let totalGeralSalvos = 0;
  let totalGeralAtualizados = 0;
  let totalGeralProdutos = 0;

  for (const categoria of categorias) {
    const resultado = await atualizarTermo(categoria);
    totalGeralSalvos += resultado.salvos;
    totalGeralAtualizados += resultado.atualizados;
    totalGeralProdutos += resultado.total;
    
    // Pequena pausa entre categorias para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Limpar produtos antigos
  console.log('\n🧹 Limpando produtos antigos...');
  const removidos = await limparProdutosAntigos();
  console.log(`   🗑️  ${removidos} produtos removidos\n`);

  // Resumo final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Atualização completa concluída!');
  console.log(`📊 Total: ${totalGeralProdutos} produtos processados`);
  console.log(`   • ${totalGeralSalvos} novos`);
  console.log(`   • ${totalGeralAtualizados} atualizados`);
  console.log(`   • ${removidos} removidos`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
  process.exit(0);
}

// Executar
atualizarCategorias().catch(erro => {
  console.error('❌ Erro fatal:', erro);
  process.exit(1);
});
