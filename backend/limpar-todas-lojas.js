require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparTodasLojas() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Iniciando limpeza completa de todas as lojas...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 1. REMOVER PRODUTOS COM PREÇOS ABSURDOS
    console.log('📋 ETAPA 1: Removendo produtos com preços absurdos...\n');
    
    // PCDiga - preços muito altos (> 50.000€)
    const pcdiga = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'PCDiga' AND preco > 50000
      RETURNING id, nome, preco
    `);
    console.log(`  ❌ PCDiga: ${pcdiga.rowCount} produtos com preços > 50.000€`);
    if (pcdiga.rowCount > 0) {
      pcdiga.rows.slice(0, 3).forEach(p => {
        console.log(`     - ${p.nome} (${parseFloat(p.preco).toFixed(2)}€)`);
      });
      if (pcdiga.rowCount > 3) console.log(`     ... e mais ${pcdiga.rowCount - 3}`);
    }
    
    // GlobalData - preços muito altos (> 30.000€)
    const globaldata = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'GlobalData' AND preco > 30000
      RETURNING id, nome, preco
    `);
    console.log(`  ❌ GlobalData: ${globaldata.rowCount} produtos com preços > 30.000€`);
    
    // Worten - preços muito altos (> 20.000€)
    const worten = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'Worten' AND preco > 20000
      RETURNING id, nome, preco
    `);
    console.log(`  ❌ Worten: ${worten.rowCount} produtos com preços > 20.000€`);
    
    // PCBem - preços muito altos (> 20.000€)
    const pcbem = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'PCBem' AND preco > 20000
      RETURNING id, nome, preco
    `);
    console.log(`  ❌ PCBem: ${pcbem.rowCount} produtos com preços > 20.000€`);
    
    // Radio Popular - preços muito altos (> 15.000€)
    const radiopopular = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'Radio Popular' AND preco > 15000
      RETURNING id, nome, preco
    `);
    console.log(`  ❌ Radio Popular: ${radiopopular.rowCount} produtos com preços > 15.000€`);
    
    const totalAbsurdos = pcdiga.rowCount + globaldata.rowCount + worten.rowCount + pcbem.rowCount + radiopopular.rowCount;
    console.log(`\n  ✅ Total removido: ${totalAbsurdos} produtos com preços absurdos\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 2. REMOVER DUPLICATAS
    console.log('📋 ETAPA 2: Removendo duplicatas (mantendo o mais recente)...\n');
    
    const lojas = ['PCDiga', 'PCBem', 'Worten', 'Radio Popular', 'Chip7', 'GlobalData'];
    let totalDuplicatas = 0;
    
    for (const loja of lojas) {
      const resultado = await client.query(`
        DELETE FROM produtos 
        WHERE loja = $1 AND id IN (
          SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (
                     PARTITION BY nome, loja 
                     ORDER BY atualizado_em DESC
                   ) as rn
            FROM produtos
            WHERE loja = $1
          ) t
          WHERE t.rn > 1
        )
        RETURNING id
      `, [loja]);
      
      console.log(`  🗑️ ${loja}: ${resultado.rowCount} duplicatas removidas`);
      totalDuplicatas += resultado.rowCount;
    }
    
    console.log(`\n  ✅ Total removido: ${totalDuplicatas} produtos duplicados\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 3. ESTATÍSTICAS FINAIS
    console.log('📊 ESTATÍSTICAS FINAIS:\n');
    
    const stats = await client.query(`
      SELECT 
        loja, 
        COUNT(*) as total, 
        MIN(preco) as min, 
        MAX(preco) as max, 
        AVG(preco) as avg
      FROM produtos 
      GROUP BY loja 
      ORDER BY loja
    `);
    
    let totalGeral = 0;
    stats.rows.forEach(row => {
      console.log(`${row.loja}:`);
      console.log(`  Produtos: ${row.total}`);
      console.log(`  Preço: ${parseFloat(row.min).toFixed(2)}€ - ${parseFloat(row.max).toFixed(2)}€`);
      console.log(`  Média: ${parseFloat(row.avg).toFixed(2)}€\n`);
      totalGeral += parseInt(row.total);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ TOTAL GERAL: ${totalGeral} produtos únicos e válidos\n`);
    
    // 4. VERIFICAR SE AINDA HÁ DUPLICATAS
    const verificarDuplicatas = await client.query(`
      SELECT 
        loja,
        COUNT(*) as total_duplicatas
      FROM (
        SELECT 
          loja,
          nome,
          COUNT(*) as qtd
        FROM produtos
        GROUP BY loja, nome
        HAVING COUNT(*) > 1
      ) t
      GROUP BY loja
      ORDER BY loja
    `);
    
    if (verificarDuplicatas.rows.length > 0) {
      console.log('⚠️ Ainda existem duplicatas:\n');
      verificarDuplicatas.rows.forEach(row => {
        console.log(`  ${row.loja}: ${row.total_duplicatas} produtos duplicados`);
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada!\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Limpeza concluída com sucesso!\n');
    console.log('💡 Dica: O código foi corrigido. Novos scrapes não terão esses problemas.\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limparTodasLojas();
