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

// POST /api/produtos/buscar-lojas - Buscar produtos agrupados por loja (DO BANCO)
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

    // BUSCAR DO BANCO (produtos já salvos pelo script scrape-and-save.js)
    console.log(`🔍 Buscando "${termo}" no banco de dados...`);
    const produtos = await db.query(
      `SELECT * FROM produtos 
       WHERE LOWER(nome) LIKE LOWER($1)
       AND atualizado_em > NOW() - INTERVAL '7 days'
       ORDER BY loja, preco ASC`,
      [`%${termo}%`]
    );
    console.log(`📊 Produtos encontrados no banco: ${produtos.rows.length}`);

    // Agrupar produtos por loja
    const resultados = {};
    const lojas = [];

    produtos.rows.forEach(produto => {
      const lojaId = produto.loja.toLowerCase().replace(/\s+/g, '-');
      
      if (!resultados[lojaId]) {
        resultados[lojaId] = {
          loja: produto.loja,
          quantidade: 0,
          produtos: []
        };
        lojas.push({
          id: lojaId,
          nome: produto.loja,
          quantidade: 0
        });
      }

      resultados[lojaId].produtos.push({
        id: produto.id,
        id_externo: produto.produto_id_externo,
        nome: produto.nome,
        preco: parseFloat(produto.preco),
        preco_original: produto.preco_original ? parseFloat(produto.preco_original) : null,
        url: produto.url,
        imagem: produto.imagem,
        loja: produto.loja,
        condicao: produto.condicao,
        disponibilidade: produto.disponibilidade,
        vendedor: produto.vendedor
      });

      resultados[lojaId].quantidade++;
      const lojaIndex = lojas.findIndex(l => l.id === lojaId);
      if (lojaIndex >= 0) lojas[lojaIndex].quantidade++;
    });

    // Se não encontrou nada no banco, usar dados mock
    let usandoMock = false;
    if (produtos.rows.length === 0) {
      console.log('⚠️ Nenhum produto no banco, usando dados de demonstração');
      const mockResultados = gerarDadosMock(termo);
      usandoMock = true;
      
      for (const [lojaId, dados] of Object.entries(mockResultados)) {
        resultados[lojaId] = dados;
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
      resultados,
      total: produtos.rows.length,
      usandoMock,
      ultimaAtualizacao: produtos.rows.length > 0 ? produtos.rows[0].atualizado_em : null
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
