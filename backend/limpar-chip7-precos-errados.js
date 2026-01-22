require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparChip7PrecosErrados() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Limpando produtos da Chip7 com preços suspeitos...\n');
    
    // Remover portáteis gaming com preços muito baixos (< 800€ é suspeito para gaming)
    const gaming = await client.query(`
      DELETE FROM produtos 
      WHERE loja = 'Chip7' 
      AND (
        (nome ILIKE '%gaming%' AND preco < 800)
        OR (nome ILIKE '%razer%' AND preco < 1000)
        OR (nome ILIKE '%rtx 50%' AND preco < 800)
        OR (nome ILIKE '%rtx 40%' AND preco < 600)
        OR (nome ILIKE '%i9-%' AND preco < 700)
        OR (nome ILIKE '%ryzen 9%' AND preco < 700)
        OR (nome ILIKE '%ultra 7%' AND preco < 600)
        OR (nome ILIKE '%32gb%' AND preco < 600)
      )
      RETURNING id, nome, preco
    `);
    
    console.log(`❌ Removidos ${gaming.rowCount} produtos gaming com preços suspeitos:`);
    gaming.rows.slice(0, 5).forEach(p => {
      console.log(`   - ${p.nome.substring(0, 80)}`);
      console.log(`     Preço errado: ${parseFloat(p.preco).toFixed(2)}€`);
    });
    if (gaming.rowCount > 5) {
      console.log(`   ... e mais ${gaming.rowCount - 5} produtos\n`);
    } else {
      console.log('');
    }
    
    // Estatísticas após limpeza
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        MIN(preco) as min,
        MAX(preco) as max,
        AVG(preco) as avg
      FROM produtos 
      WHERE loja = 'Chip7'
    `);
    
    if (stats.rows[0].total > 0) {
      const s = stats.rows[0];
      console.log('📊 Chip7 após limpeza:');
      console.log(`  Total: ${s.total} produtos`);
      console.log(`  Preços: ${parseFloat(s.min).toFixed(2)}€ - ${parseFloat(s.max).toFixed(2)}€`);
      console.log(`  Média: ${parseFloat(s.avg).toFixed(2)}€\n`);
    }
    
    console.log('✅ Limpeza concluída!\n');
    console.log('💡 O código foi corrigido. Faça uma nova busca para pegar preços corretos.\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limparChip7PrecosErrados();
