require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'https://tecnocomparador.vercel.app',
  /^https:\/\/tecnocomparador-[a-z0-9]+-douglas-pedrosos-projects\.vercel\.app$/, // Deployments do Vercel
  /^https:\/\/tecnocomparador-.*\.vercel\.app$/ // Preview branches do Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    // Verifica se a origin é permitida
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      }
      // Se for regex
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session para OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const produtosRoutes = require('./routes/produtos');
const favoritosRoutes = require('./routes/favoritos');

app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/favoritos', favoritosRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Comparador de Preços está online! 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      produtos: '/api/produtos',
      favoritos: '/api/favoritos'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
