require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparNomesDuplicados() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Limpando produtos com nomes duplicados...\n');
    
    // Remover duplicatas por nome, mantendo apenas o mais recente
    const resultado = await client.query(`
      DELETE FROM produtos 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, 
                 ROW_NUMBER() OVER (
                   PARTITION BY nome, loja 
                   ORDER BY atualizado_em DESC, id DESC
                 ) as rn
          FROM produtos
        ) t
        WHERE t.rn > 1
      )
      RETURNING id, nome, loja
    `);
    
    console.log(`✅ ${resultado.rowCount} produtos duplicados removidos!\n`);
    
    // Estatísticas atualizadas
    const stats = await client.query(`
      SELECT loja, COUNT(*) as total 
      FROM produtos 
      GROUP BY loja 
      ORDER BY loja
    `);
    
    console.log('📊 Produtos únicos restantes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    let total = 0;
    stats.rows.forEach(row => {
      console.log(`  ${row.loja}: ${row.total} produtos`);
      total += parseInt(row.total);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ TOTAL: ${total} produtos únicos\n`);
    
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limparNomesDuplicados();
