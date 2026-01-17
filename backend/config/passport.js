const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

// Serialização do usuário
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Estratégia Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Verificar se usuário já existe
      const checkUser = await db.query(
        'SELECT * FROM usuarios WHERE oauth_provider = $1 AND oauth_id = $2',
        ['google', profile.id]
      );

      if (checkUser.rows.length > 0) {
        return done(null, checkUser.rows[0]);
      }

      // Criar novo usuário
      const newUser = await db.query(
        `INSERT INTO usuarios (nome, email, oauth_provider, oauth_id, avatar) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          profile.displayName,
          profile.emails[0].value,
          'google',
          profile.id,
          profile.photos[0]?.value
        ]
      );

      done(null, newUser.rows[0]);
    } catch (err) {
      done(err, null);
    }
  }));
}

// Estratégia Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const checkUser = await db.query(
        'SELECT * FROM usuarios WHERE oauth_provider = $1 AND oauth_id = $2',
        ['facebook', profile.id]
      );

      if (checkUser.rows.length > 0) {
        return done(null, checkUser.rows[0]);
      }

      const newUser = await db.query(
        `INSERT INTO usuarios (nome, email, oauth_provider, oauth_id, avatar) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          profile.displayName,
          profile.emails[0].value,
          'facebook',
          profile.id,
          profile.photos[0]?.value
        ]
      );

      done(null, newUser.rows[0]);
    } catch (err) {
      done(err, null);
    }
  }));
}

module.exports = passport;
