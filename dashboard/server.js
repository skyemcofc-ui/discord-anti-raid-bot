const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const Database = require('../bot/database/db');
require('dotenv').config();

const app = express();
const db = new Database();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Configurar estratégia Discord - CORRIGIDO
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware de autenticação
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Rotas de Autenticação
app.get('/auth/discord', passport.authenticate('discord', {
  scope: ['identify', 'guilds']
}));

app.get('/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/',
    successRedirect: '/dashboard'
  })
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// API Endpoints
app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json(req.user);
});

app.get('/api/guilds', ensureAuthenticated, (req, res) => {
  if (!req.user.guilds) {
    return res.json([]);
  }
  res.json(req.user.guilds);
});

app.get('/api/guild/:guildId/stats', ensureAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    
    const stats = await db.get(
      'SELECT * FROM statistics WHERE guild_id = ? LIMIT 1',
      [guildId]
    );
    
    const logs = await db.all(
      'SELECT * FROM raid_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 50',
      [guildId]
    );
    
    res.json({ stats: stats || {}, logs: logs || [] });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.json({ stats: {}, logs: [] });
  }
});

app.get('/api/guild/:guildId/settings', ensureAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    let settings = await db.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
    
    // Se não existe, criar padrão
    if (!settings) {
      await db.run(
        'INSERT INTO guilds (id, raid_threshold, time_window, action, antiraid_enabled) VALUES (?, ?, ?, ?, 1)',
        [guildId, 5, 10, 'ban']
      );
      settings = {
        id: guildId,
        raid_threshold: 5,
        time_window: 10,
        action: 'ban',
        antiraid_enabled: 1
      };
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Erro ao buscar settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guild/:guildId/settings', ensureAuthenticated, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const { raid_threshold, time_window, action } = req.body;
    
    // Validar entrada
    if (!raid_threshold || !time_window || !action) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar se existe
    const existing = await db.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
    
    if (existing) {
      await db.run(
        'UPDATE guilds SET raid_threshold = ?, time_window = ?, action = ? WHERE id = ?',
        [raid_threshold, time_window, action, guildId]
      );
    } else {
      await db.run(
        'INSERT INTO guilds (id, raid_threshold, time_window, action, antiraid_enabled) VALUES (?, ?, ?, ?, 1)',
        [guildId, raid_threshold, time_window, action]
      );
    }
    
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dashboard
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.DASHBOARD_PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🌐 Dashboard rodando em porta ${PORT}      ║
║  Acesse: http://localhost:${PORT}          ║
║  OAuth Callback: http://localhost:3000/auth/discord/callback
╚════════════════════════════════════════╝
  `);
});
