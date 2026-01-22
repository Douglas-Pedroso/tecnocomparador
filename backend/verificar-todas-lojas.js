require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verificarTodasLojas() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Estatísticas por loja:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Estatísticas gerais
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
    
    stats.rows.forEach(row => {
      console.log(`\n${row.loja}:`);
      console.log(`  Total de produtos: ${row.total}`);
      console.log(`  Preço mínimo: ${parseFloat(row.min).toFixed(2)}€`);
      console.log(`  Preço máximo: ${parseFloat(row.max).toFixed(2)}€`);
      console.log(`  Preço médio: ${parseFloat(row.avg).toFixed(2)}€`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Verificar duplicatas por loja
    console.log('\n🔍 Verificando duplicatas por loja:\n');
    
    const duplicatas = await client.query(`
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
    
    if (duplicatas.rows.length > 0) {
      duplicatas.rows.forEach(row => {
        console.log(`  ${row.loja}: ${row.total_duplicatas} produtos com duplicatas`);
      });
    } else {
      console.log('  ✅ Nenhuma duplicata encontrada!');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarTodasLojas();
