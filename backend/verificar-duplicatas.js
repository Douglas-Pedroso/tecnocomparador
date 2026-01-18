require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verificarDuplicatas() {
  try {
    // Procurar produtos com mesmo nome mas id_externo diferente
    const resultado = await pool.query(`
      SELECT nome, loja, COUNT(*) as vezes
      FROM produtos 
      WHERE loja = 'Chip7'
      GROUP BY nome, loja 
      HAVING COUNT(*) > 1 
      ORDER BY vezes DESC 
      LIMIT 15
    `);
    
    console.log('\n🔍 Produtos duplicados (mesmo nome, IDs diferentes):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    resultado.rows.forEach(row => {
      const nomeAbreviado = row.nome.substring(0, 70);
      console.log(`${row.vezes}x - ${nomeAbreviado}...`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Mostrar IDs de um produto específico duplicado
    if (resultado.rows.length > 0) {
      const primeiroDuplicado = resultado.rows[0].nome;
      const ids = await pool.query(
        'SELECT id, produto_id_externo, preco FROM produtos WHERE nome = $1 AND loja = $2',
        [primeiroDuplicado, 'Chip7']
      );
      
      console.log(`📋 Exemplo: "${primeiroDuplicado.substring(0, 50)}..."`);
      console.log('   IDs diferentes para o mesmo produto:');
      ids.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ID: ${row.id} | id_externo: ${row.produto_id_externo.substring(0, 30)}... | €${row.preco}`);
      });
      console.log('');
    }
    
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await pool.end();
  }
}

verificarDuplicatas();
