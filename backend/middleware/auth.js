const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    // Pegar token do header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, nome }
    
    // Definir o usuário atual no contexto do banco (para RLS)
    try {
      await db.query('SELECT set_current_user_id($1)', [decoded.id]);
    } catch (dbError) {
      console.warn('Aviso: Não foi possível definir contexto de usuário no banco:', dbError.message);
    }
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
