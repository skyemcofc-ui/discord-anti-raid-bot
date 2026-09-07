const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
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
    GatewayIntentBits.DirectMessages,
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

// ========== CARREGAR EVENTOS ==========
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

// ========== CARREGAR COMANDOS ==========
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`✅ Comando carregado: ${file}`);
  }
}

// ========== REGISTRAR SLASH COMMANDS ==========
client.on('ready', async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    console.log('🔄 Registrando slash commands...');
    
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    console.log('✅ Slash commands registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar slash commands:', error);
  }
});

// ========== HANDLER DE INTERAÇÕES (COMANDOS) ==========
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    return interaction.reply({
      content: '❌ Comando não encontrado!',
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction, client, db);
  } catch (error) {
    console.error('❌ Erro ao executar comando:', error);
    
    const errorMessage = {
      content: '❌ Houve um erro ao executar este comando!',
      ephemeral: true
    };

    if (interaction.replied) {
      await interaction.followUp(errorMessage);
    } else if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// ========== MONITORAR USO DE MEMÓRIA ==========
setInterval(() => {
  const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memUsage > 85) {
    console.warn(`⚠️ Uso de RAM alto: ${memUsage.toFixed(2)}MB`);
    cleanupCache();
  }
}, 30000);

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of client.memberCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutos
      client.memberCache.delete(key);
    }
  }
}

// ========== LOGIN ==========
client.login(process.env.DISCORD_TOKEN);

module.exports = { client, db, initialMemory };
