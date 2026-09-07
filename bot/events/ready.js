module.exports = {
  name: 'ready',
  once: true,
  execute: async (client, db) => {
    console.log(`
╔════════════════════════════════════════╗
║  🛡️  Discord Anti-Raid Bot Online!     ║
║  Usuário: ${client.user.username.padEnd(27)}║
║  Servidores: ${client.guilds.cache.size.toString().padEnd(24)}║
║  Usuários: ${client.users.cache.size.toString().padEnd(26)}║
╚════════════════════════════════════════╝
    `);

    const memUsage = process.memoryUsage();
    console.log(`
📊 Status de Memória:
   Heap Usado: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB
   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB
    `);
  }
};
