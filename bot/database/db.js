const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../database');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    this.db = new sqlite3.Database(path.join(dbPath, 'bot.db'), (err) => {
      if (err) console.error('❌ Erro ao conectar DB:', err);
      else console.log('✅ Banco de dados conectado');
    });

    this.initialize();
  }

  initialize() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '/',
        antiraid_enabled BOOLEAN DEFAULT 1,
        raid_threshold INTEGER DEFAULT 5,
        time_window INTEGER DEFAULT 10,
        action TEXT DEFAULT 'ban',
        logs_channel TEXT,
        verified_role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS raid_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        action TEXT,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(guild_id) REFERENCES guilds(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS join_tracker (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(guild_id) REFERENCES guilds(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS whitelist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        reason TEXT,
        FOREIGN KEY(guild_id) REFERENCES guilds(id)
      )`,

      `CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        raids_detected INTEGER DEFAULT 0,
        members_banned INTEGER DEFAULT 0,
        members_kicked INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(guild_id) REFERENCES guilds(id)
      )`
    ];

    queries.forEach(query => {
      this.db.run(query, (err) => {
        if (err) console.error('❌ Erro ao criar tabela:', err);
      });
    });
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
