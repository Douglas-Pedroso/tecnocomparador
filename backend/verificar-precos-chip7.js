require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verificarPrecosChip7() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verificando produtos da Chip7 com preços suspeitos...\n');
    
    // Buscar produtos que mencionam "Razer" ou têm preços muito baixos para portáteis
    const resultado = await client.query(`
      SELECT id, nome, preco, url
      FROM produtos 
      WHERE loja = 'Chip7' 
      AND (
        nome ILIKE '%razer%' 
        OR nome ILIKE '%blade%'
        OR (nome ILIKE '%portátil%' AND preco < 500)
        OR (nome ILIKE '%laptop%' AND preco < 500)
      )
      ORDER BY preco ASC
      LIMIT 20
    `);
    
    console.log(`📦 Encontrados ${resultado.rowCount} produtos suspeitos:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    resultado.rows.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome}`);
      console.log(`   💰 Preço no banco: ${parseFloat(p.preco).toFixed(2)}€`);
      console.log(`   🔗 URL: ${p.url}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Estatísticas de portáteis da Chip7
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        MIN(preco) as min,
        MAX(preco) as max,
        AVG(preco) as avg
      FROM produtos 
      WHERE loja = 'Chip7' 
      AND nome ILIKE '%portátil%'
    `);
    
    if (stats.rows[0].total > 0) {
      const s = stats.rows[0];
      console.log('📊 Estatísticas de Portáteis Chip7:');
      console.log(`  Total: ${s.total}`);
      console.log(`  Mínimo: ${parseFloat(s.min).toFixed(2)}€`);
      console.log(`  Máximo: ${parseFloat(s.max).toFixed(2)}€`);
      console.log(`  Média: ${parseFloat(s.avg).toFixed(2)}€\n`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarPrecosChip7();
