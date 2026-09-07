const { Client, GatewayIntentBits, Collection, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Database = require('./database/db');

// Criar cliente com intents minimalistas para economizar RAM
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: [] },
  presence: {
    status: 'online',
    activities: [{ name: '🛡️ Protegendo servidores', type: 'WATCHING' }]
  }
});

// Inicializar banco de dados
const db = new Database();

// Sistema de cache otimizado
client.antiRaidCache = new Collection();
client.cooldowns = new Collection();
client.memberCache = new Map();

// Estatísticas de RAM
const startTime = Date.now();
const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client, db));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client, db));
  }
  console.log(`✅ Evento carregado: ${file}`);
}

// Carregar comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Comando carregado: ${file}`);
  }
}

// Monitorar uso de memória
setInterval(() => {
  const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memUsage > 85) {
    console.warn(`⚠️ Uso de RAM alto: ${memUsage.toFixed(2)}MB`);
    // Limpar caches desnecessários
    cleanupCache();
  }
}, 30000);

function cleanupCache() {
  // Limpar membros em cache antigos
  const now = Date.now();
  for (const [key, value] of client.memberCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutos
      client.memberCache.delete(key);
    }
  }
}

// Login
client.login(process.env.DISCORD_TOKEN);

module.exports = { client, db, initialMemory };
