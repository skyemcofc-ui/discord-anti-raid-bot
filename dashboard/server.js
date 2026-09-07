const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require('cors');
const path = require('path');
const Database = require('../bot/database/db');
require('dotenv').config();

const app = express();
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Configurar estratégia Discord
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.DASHBOARD_URL}/auth/discord/callback`,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Rotas de Autenticação
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// API Endpoints
app.get('/api/user', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  res.json(req.user);
});

app.get('/api/guilds', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  res.json(req.user.guilds);
});

app.get('/api/guild/:guildId/stats', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    
    const guildId = req.params.guildId;
    const stats = await db.get('SELECT * FROM statistics WHERE guild_id = ?', [guildId]);
    const logs = await db.all(
      'SELECT * FROM raid_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 50',
      [guildId]
    );
    
    res.json({ stats, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/guild/:guildId/settings', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    
    const guildId = req.params.guildId;
    const settings = await db.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guild/:guildId/settings', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    
    const guildId = req.params.guildId;
    const { raid_threshold, time_window, action, logs_channel, verified_role } = req.body;
    
    await db.run(
      'UPDATE guilds SET raid_threshold = ?, time_window = ?, action = ?, logs_channel = ?, verified_role = ? WHERE id = ?',
      [raid_threshold, time_window, action, logs_channel, verified_role, guildId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir arquivo HTML principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.DASHBOARD_PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Dashboard rodando em porta ${PORT}        ║
║  Acesse: http://localhost:${PORT}          ║
╚════════════════════════════════════════╝
  `);
});
