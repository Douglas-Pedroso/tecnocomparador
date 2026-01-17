const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { gerarDadosMock } = require('../services/scraper');
const { buscarComPuppeteer } = require('../services/puppeteer-scraper');

// Salvar produtos no banco (cache)
const salvarProdutos = async (produtos) => {
  const produtosSalvos = [];
  
  for (const produto of produtos) {
    try {
      // Verificar se já existe
      const existe = await db.query(
        'SELECT id FROM produtos WHERE produto_id_externo = $1 AND loja = $2',
        [produto.id_externo, produto.loja]
      );

      if (existe.rows.length > 0) {
        // Atualizar produto existente
        const atualizado = await db.query(
          `UPDATE produtos 
           SET nome = $1, preco = $2, preco_original = $3, url = $4, 
               imagem = $5, condicao = $6, disponibilidade = $7, vendedor = $8,
               atualizado_em = CURRENT_TIMESTAMP
           WHERE id = $9
           RETURNING *`,
          [
            produto.nome, produto.preco, produto.preco_original, produto.url,
            produto.imagem, produto.condicao, produto.disponibilidade, 
            produto.vendedor, existe.rows[0].id
          ]
        );
        produtosSalvos.push(atualizado.rows[0]);
      } else {
        // Inserir novo produto
        const novo = await db.query(
          `INSERT INTO produtos 
           (produto_id_externo, nome, preco, preco_original, url, imagem, 
            loja, condicao, disponibilidade, vendedor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            produto.id_externo || `prod_${Date.now()}_${Math.random()}`,
            produto.nome,
            produto.preco,
            produto.preco_original || produto.preco,
            produto.url || 'https://exemplo.com',
            produto.imagem || 'https://via.placeholder.com/300',
            produto.loja,
            produto.condicao || 'Novo',
            produto.disponibilidade || 'Disponível',
            produto.vendedor || produto.loja
          ]
        );
        produtosSalvos.push(novo.rows[0]);
      }
    } catch (err) {
      console.error('Erro ao salvar produto:', err.message);
    }
  }

  return produtosSalvos;
};

// POST /api/produtos/buscar-lojas - Buscar produtos agrupados por loja
router.post('/buscar-lojas', async (req, res) => {
  try {
    const { termo } = req.body;

    if (!termo || termo.trim() === '') {
      return res.status(400).json({ error: 'Termo de busca obrigatório' });
    }

    // Salvar histórico se usuário estiver logado
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await db.query(
          'INSERT INTO historico_pesquisas (usuario_id, termo_busca) VALUES ($1, $2)',
          [decoded.id, termo]
        );
      } catch (err) {
        // Ignorar erro de histórico
      }
    }

    // Scraping real com Puppeteer (sites JavaScript)
    console.log(`🔍 Buscando "${termo}" nas lojas...`);
    let resultados = await buscarComPuppeteer(termo);
    
    // Se Puppeteer não encontrou nada, usar dados mock como fallback
    if (Object.keys(resultados).length === 0) {
      console.log('⚠️ Nenhum resultado real, usando dados de demonstração');
      resultados = gerarDadosMock(termo);
    }

    // Salvar produtos no banco
    const lojas = [];
    for (const [lojaId, dados] of Object.entries(resultados)) {
      if (dados.produtos && dados.produtos.length > 0) {
        await salvarProdutos(dados.produtos);
        lojas.push({
          id: lojaId,
          nome: dados.loja,
          quantidade: dados.quantidade
        });
      }
    }

    res.json({
      termo,
      lojas,
      resultados
    });
  } catch (err) {
    console.error('Erro ao buscar por lojas:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST /api/produtos/salvar - Salvar produtos no cache (enviados pelo frontend)
router.post('/salvar', async (req, res) => {
  try {
    const { busca, produtos } = req.body;

    if (!produtos || produtos.length === 0) {
      return res.json({ message: 'Nenhum produto para salvar' });
    }

    // Salvar histórico se usuário estiver logado
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await db.query(
          'INSERT INTO historico_pesquisas (usuario_id, termo_busca) VALUES ($1, $2)',
          [decoded.id, busca]
        );
      } catch (err) {
        // Ignorar erro de histórico
      }
    }

    // Salvar produtos no banco
    const produtosSalvos = await salvarProdutos(produtos);

    res.json({
      message: 'Produtos salvos!',
      total: produtosSalvos.length
    });
  } catch (err) {
    console.error('Erro ao salvar produtos:', err);
    res.status(500).json({ error: 'Erro ao salvar produtos' });
  }
});

// GET /api/produtos/:id - Detalhes de um produto
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM produtos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ produto: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// GET /api/produtos/usuario/historico - Histórico de pesquisas (autenticado)
router.get('/usuario/historico', authMiddleware, async (req, res) => {
  try {
    const { limite = 10 } = req.query;

    const result = await db.query(
      `SELECT DISTINCT ON (termo_busca) termo_busca, criado_em
       FROM historico_pesquisas
       WHERE usuario_id = $1
       ORDER BY termo_busca, criado_em DESC
       LIMIT $2`,
      [req.user.id, parseInt(limite)]
    );

    res.json({
      historico: result.rows
    });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
