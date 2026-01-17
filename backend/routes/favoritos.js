const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/favoritos - Listar favoritos do usuário
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.id as favorito_id, f.criado_em as favoritado_em,
              p.id, p.produto_id_externo, p.nome, p.preco, p.preco_original,
              p.url, p.imagem, p.loja, p.condicao, p.disponibilidade, p.vendedor
       FROM favoritos f
       INNER JOIN produtos p ON f.produto_id = p.id
       WHERE f.usuario_id = $1
       ORDER BY f.criado_em DESC`,
      [req.user.id]
    );

    res.json({
      favoritos: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Erro ao buscar favoritos:', err);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// POST /api/favoritos - Adicionar produto aos favoritos
router.post('/', async (req, res) => {
  try {
    const { produto_id, produto } = req.body;

    if (!produto_id) {
      return res.status(400).json({ error: 'ID do produto obrigatório' });
    }

    let produtoDbId = produto_id;

    // Se produto_id parece ser um id_externo (UUID/string longa), buscar ou criar produto
    if (isNaN(produto_id) || produto_id.length > 10) {
      // Buscar produto por id_externo
      let produtoExiste = await db.query(
        'SELECT id FROM produtos WHERE produto_id_externo = $1',
        [produto_id]
      );

      if (produtoExiste.rows.length === 0 && produto) {
        // Criar produto se dados foram fornecidos
        const novoProduto = await db.query(
          `INSERT INTO produtos 
           (produto_id_externo, nome, url, preco, preco_original, loja, imagem, condicao, disponibilidade, vendedor)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            produto_id,
            produto.nome || 'Produto sem nome',
            produto.url || '',
            produto.preco || 0,
            produto.preco_original || produto.preco || 0,
            produto.loja || 'Desconhecida',
            produto.imagem || '',
            produto.condicao || 'Novo',
            produto.disponibilidade || 'Em estoque',
            produto.vendedor || produto.loja || ''
          ]
        );
        produtoDbId = novoProduto.rows[0].id;
      } else if (produtoExiste.rows.length > 0) {
        produtoDbId = produtoExiste.rows[0].id;
      } else {
        return res.status(404).json({ error: 'Produto não encontrado e dados insuficientes para criar' });
      }
    } else {
      // Produto_id numérico, verificar se existe
      const produtoExiste = await db.query(
        'SELECT id FROM produtos WHERE id = $1',
        [produto_id]
      );

      if (produtoExiste.rows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
    }

    // Verificar se já está favoritado
    const jaFavoritado = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = $1 AND produto_id = $2',
      [req.user.id, produtoDbId]
    );

    if (jaFavoritado.rows.length > 0) {
      return res.status(400).json({ error: 'Produto já está nos favoritos' });
    }

    // Adicionar aos favoritos
    const novoFavorito = await db.query(
      `INSERT INTO favoritos (usuario_id, produto_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, produtoDbId]
    );

    res.status(201).json({
      message: 'Produto adicionado aos favoritos!',
      favorito: novoFavorito.rows[0]
    });
  } catch (err) {
    console.error('Erro ao adicionar favorito:', err);
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
});

// DELETE /api/favoritos/:id - Remover favorito
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se favorito existe e pertence ao usuário
    const favorito = await db.query(
      'SELECT id FROM favoritos WHERE id = $1 AND usuario_id = $2',
      [id, req.user.id]
    );

    if (favorito.rows.length === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado' });
    }

    // Remover favorito
    await db.query('DELETE FROM favoritos WHERE id = $1', [id]);

    res.json({ message: 'Favorito removido com sucesso!' });
  } catch (err) {
    console.error('Erro ao remover favorito:', err);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// DELETE /api/favoritos/produto/:produto_id - Remover por ID do produto
router.delete('/produto/:produto_id', async (req, res) => {
  try {
    const { produto_id } = req.params;
    let produtoDbId = produto_id;

    // Se produto_id parece ser um id_externo (UUID/string longa), buscar o ID real
    if (isNaN(produto_id) || produto_id.length > 10) {
      const produtoExiste = await db.query(
        'SELECT id FROM produtos WHERE produto_id_externo = $1',
        [produto_id]
      );

      if (produtoExiste.rows.length === 0) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      
      produtoDbId = produtoExiste.rows[0].id;
    }

    const result = await db.query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND produto_id = $2 RETURNING id',
      [req.user.id, produtoDbId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorito não encontrado' });
    }

    res.json({ message: 'Favorito removido com sucesso!' });
  } catch (err) {
    console.error('Erro ao remover favorito:', err);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

module.exports = router;
