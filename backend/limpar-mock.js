require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparDadosMock() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Limpando dados MOCK do banco...\n');
    
    // Remover todos os produtos mock
    const resultado = await client.query(`
      DELETE FROM produtos 
      WHERE produto_id_externo LIKE 'mock_%'
      RETURNING id, nome, loja
    `);
    
    console.log(`✅ ${resultado.rowCount} produtos MOCK removidos!\n`);
    
    // Mostrar alguns exemplos removidos
    if (resultado.rows.length > 0) {
      console.log('📋 Exemplos removidos:');
      resultado.rows.slice(0, 5).forEach(row => {
        console.log(`   • ${row.loja}: ${row.nome.substring(0, 50)}...`);
      });
      console.log('');
    }
    
    // Estatísticas atualizadas
    const stats = await client.query(`
      SELECT loja, COUNT(*) as total 
      FROM produtos 
      GROUP BY loja 
      ORDER BY loja
    `);
    
    console.log('📊 Produtos REAIS restantes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    let total = 0;
    stats.rows.forEach(row => {
      console.log(`  ${row.loja}: ${row.total} produtos`);
      total += parseInt(row.total);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ TOTAL: ${total} produtos\n`);
    
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limparDadosMock();
