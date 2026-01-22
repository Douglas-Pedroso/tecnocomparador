require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function corrigirChip7() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Corrigindo produtos da Chip7...\n');
    
    // 1. Remover produtos com preços suspeitos (muito baixos)
    const removidosBaixos = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'Chip7' 
      AND preco < 100
      AND (nome LIKE '%Portátil%' OR nome LIKE '%Laptop%' OR nome LIKE '%ThinkPad%' OR nome LIKE '%ThinkBook%')
      RETURNING id, nome, preco
    `);
    
    console.log(`❌ Removidos ${removidosBaixos.rowCount} produtos com preços incorretos (< 100€):`);
    removidosBaixos.rows.slice(0, 5).forEach(p => {
      console.log(`   - ${p.nome} (${p.preco}€)`);
    });
    if (removidosBaixos.rowCount > 5) {
      console.log(`   ... e mais ${removidosBaixos.rowCount - 5} produtos\n`);
    } else {
      console.log('');
    }
    
    // 2. Remover duplicatas mantendo apenas o mais recente
    const removidosDuplicados = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'Chip7' AND id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   PARTITION BY nome, loja 
                   ORDER BY atualizado_em DESC
                 ) as rn
          FROM produtos
          WHERE loja = 'Chip7'
        ) t
        WHERE t.rn > 1
      )
      RETURNING id
    `);
    
    console.log(`🗑️ Removidos ${removidosDuplicados.rowCount} produtos duplicados da Chip7\n`);
    
    // 3. Mostrar estatísticas finais
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        MIN(preco) as preco_minimo,
        MAX(preco) as preco_maximo,
        AVG(preco) as preco_medio
      FROM produtos 
      WHERE loja = 'Chip7'
    `);
    
    if (stats.rows[0].total > 0) {
      const s = stats.rows[0];
      console.log('📊 Estatísticas Chip7 após correção:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Total de produtos: ${s.total}`);
      console.log(`  Preço mínimo: ${parseFloat(s.preco_minimo).toFixed(2)}€`);
      console.log(`  Preço máximo: ${parseFloat(s.preco_maximo).toFixed(2)}€`);
      console.log(`  Preço médio: ${parseFloat(s.preco_medio).toFixed(2)}€`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('⚠️ Nenhum produto da Chip7 restante no banco.\n');
    }
    
    // 4. Mostrar alguns produtos restantes como exemplo
    const exemplos = await client.query(`
      SELECT nome, preco, atualizado_em
      FROM produtos 
      WHERE loja = 'Chip7'
      ORDER BY atualizado_em DESC
      LIMIT 5
    `);
    
    if (exemplos.rows.length > 0) {
      console.log('📦 Exemplos de produtos restantes:');
      exemplos.rows.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.nome} - ${parseFloat(p.preco).toFixed(2)}€`);
      });
      console.log('');
    }
    
    console.log('✅ Correção concluída!\n');
    console.log('💡 Dica: Faça uma nova busca para pegar produtos atualizados.\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

corrigirChip7();
