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
    'mini PC',
    'chromebook',
    
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
    'placa som',
    'placa rede',
    
    // Telemóveis e Tablets
    'telemóvel',
    'smartphone',
    'tablet',
    'ipad',
    'iphone',
    'samsung galaxy',
    'xiaomi',
    'huawei',
    
    // Televisões e Monitores
    'televisão',
    'TV',
    'smart TV',
    'monitor',
    'monitor gaming',
    'projetor',
    'ecrã portátil',
    
    // Periféricos PC
    'teclado',
    'rato',
    'mousepad',
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
    'docking station',
    'KVM switch',
    
    // Impressoras e Scanners
    'impressora',
    'multifunções',
    'scanner',
    'tinta impressora',
    'toner',
    'papel fotográfico',
    
    // Fotografia e Vídeo
    'câmara',
    'máquina fotográfica',
    'câmara vídeo',
    'gopro',
    'drone',
    'gimbal',
    'tripé',
    'cartão memória',
    'ring light',
    'softbox',
    'microfone lapela',
    
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
    'secretária gaming',
    'tapete gaming',
    'videojogo',
    
    // Networking
    'router',
    'switch',
    'repetidor wifi',
    'access point',
    'powerline',
    'modem',
    'câmara IP',
    
    // Smartwatches e Wearables
    'smartwatch',
    'smartband',
    'relógio inteligente',
    'pulseira atividade',
    'apple watch',
    'samsung watch',
    
    // Acessórios Mobile
    'powerbank',
    'carregador',
    'cabo USB',
    'capa telemóvel',
    'película',
    'suporte carro',
    'carregador wireless',
    'carregador portátil',
    
    // Armazenamento
    'disco externo',
    'NAS',
    'pen USB',
    'cartão SD',
    'leitor cartões',
    
    // Áudio
    'earbuds',
    'airpods',
    'coluna portátil',
    'amplificador',
    'gira-discos',
    'toca-discos',
    'microfone estúdio',
    'interface áudio',
    
    // Eletrodomésticos Grandes
    'frigorífico',
    'máquina lavar roupa',
    'máquina lavar loiça',
    'fogão',
    'forno',
    'micro-ondas',
    'exaustor',
    'arca congeladora',
    'combinado',
    'placa indução',
    
    // Climatização
    'ar condicionado',
    'aquecedor',
    'desumidificador',
    'purificador ar',
    'humidificador',
    'ventoinha',
    'ventilador',
    'climatizador',
    
    // Pequenos Eletrodomésticos Cozinha
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
    'robot cozinha',
    'varinha mágica',
    'picadora',
    'sanduicheira',
    'grelhador',
    'máquina café',
    'espremedor',
    'centrifugadora',
    
    // Cuidado Pessoal
    'máquina barbear',
    'depiladora',
    'secador cabelo',
    'escova alisadora',
    'prancha cabelo',
    'escova dentes elétrica',
    'irrigador oral',
    'balança',
    'tensiómetro',
    'termómetro',
    'oxímetro',
    
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
    'sensor movimento',
    'detetor fumo',
    'alarme',
    
    // Iluminação
    'candeeiro',
    'lâmpada LED',
    'foco',
    'projetor LED',
    'tira LED',
    'luz noturna',
    
    // Escritório
    'cadeira escritório',
    'secretária',
    'mesa digitalizadora',
    'calculadora',
    'destruidor papel',
    'plastificadora',
    'encadernadora',
    'etiquetadora',
    'quadro branco',
    
    // Mobilidade Elétrica
    'trotinete elétrica',
    'bicicleta elétrica',
    'hoverboard',
    'monociclo elétrico',
    'patins elétricos',
    
    // Automoção
    'GPS auto',
    'dashcam',
    'aspirador carro',
    'carregador carro',
    'transmissor FM',
    'suporte telemóvel carro',
    
    // Bebés e Crianças
    'monitor bebé',
    'termómetro bebé',
    'esterilizador',
    'humidificador bebé',
    
    // Desporto e Fitness
    'smartwatch desporto',
    'auriculares desporto',
    'coluna prova água',
    'ciclocomputador',
    'pulsómetro',
    
    // Telefonia Fixa
    'telefone fixo',
    'telefone sem fios',
    'atendedor',
    'intercomunicador',
    
    // Entretenimento
    'leitor blu-ray',
    'leitor DVD',
    'barra som',
    'karaoke',
    'rádio',
    'despertador',
    
    // Cabos e Acessórios
    'cabo HDMI',
    'cabo USB-C',
    'cabo ethernet',
    'extensão',
    'régua',
    'UPS',
    'estabilizador',
    
    // Software e Jogos
    'windows',
    'office',
    'antivírus',
    'jogo PC',
    'jogo PS5',
    'jogo xbox',
    'jogo switch',
    
    // Bolsas e Proteção
    'mochila portátil',
    'mala portátil',
    'bolsa tablet',
    'capa portátil',
    'suporte portátil'
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
