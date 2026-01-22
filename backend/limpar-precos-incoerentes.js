require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limparPrecosIncoerentes() {
  const client = await pool.connect();
  try {
    console.log('\n🧹 Limpando produtos com preços incoerentes em todas as lojas...\n');
    // Critérios por loja
    const criterios = [
      // loja, condição, descrição
      { loja: 'Chip7', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'Chip7 gaming/alto desempenho' },
      { loja: 'PCDiga', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'PCDiga gaming/alto desempenho' },
      { loja: 'PCBem', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'PCBem gaming/alto desempenho' },
      { loja: 'Worten', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'Worten gaming/alto desempenho' },
      { loja: 'Radio Popular', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'Radio Popular gaming/alto desempenho' },
      { loja: 'GlobalData', cond: "(nome ILIKE '%gaming%' AND preco < 800) OR (nome ILIKE '%razer%' AND preco < 1000) OR (nome ILIKE '%rtx 50%' AND preco < 800) OR (nome ILIKE '%rtx 40%' AND preco < 600) OR (nome ILIKE '%i9-%' AND preco < 700) OR (nome ILIKE '%ryzen 9%' AND preco < 700) OR (nome ILIKE '%ultra 7%' AND preco < 600) OR (nome ILIKE '%32gb%' AND preco < 600)", desc: 'GlobalData gaming/alto desempenho' }
    ];
    let totalRemovidos = 0;
    for (const crit of criterios) {
      const res = await client.query(`DELETE FROM produtos WHERE loja = $1 AND (${crit.cond}) RETURNING id, nome, preco`, [crit.loja]);
      console.log(`❌ ${crit.loja}: ${res.rowCount} produtos removidos (${crit.desc})`);
      totalRemovidos += res.rowCount;
    }
    console.log(`\n✅ Total removido: ${totalRemovidos} produtos incoerentes\n`);
    // Estatísticas finais
    const stats = await client.query(`SELECT loja, COUNT(*) as total, MIN(preco) as min, MAX(preco) as max, AVG(preco) as avg FROM produtos GROUP BY loja ORDER BY loja`);
    stats.rows.forEach(row => {
      console.log(`${row.loja}: ${row.total} produtos | Preço: ${parseFloat(row.min).toFixed(2)}€ - ${parseFloat(row.max).toFixed(2)}€ | Média: ${parseFloat(row.avg).toFixed(2)}€`);
    });
    console.log('\n🎉 Limpeza concluída!\n');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

limparPrecosIncoerentes();
