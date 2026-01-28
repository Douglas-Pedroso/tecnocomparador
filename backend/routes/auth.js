const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Gerar JWT token
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Criar conta local
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se email já existe
    const usuarioExiste = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoUsuario = await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );

    const usuario = novoUsuario.rows[0];
    const token = gerarToken(usuario);

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (err) {
    console.error('Erro ao registrar:', err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// POST /api/auth/login - Login local
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Preencha email e senha' });
    }

    // Buscar usuário
    const result = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND senha_hash IS NOT NULL',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const usuario = result.rows[0];

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = gerarToken(usuario);

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        avatar: usuario.avatar
      }
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome, email, avatar, criado_em FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ usuario: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// GET /api/auth/google - Iniciar OAuth Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback - Callback OAuth Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` 
  }),
  (req, res) => {
    const token = gerarToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  }
);


module.exports = router;
