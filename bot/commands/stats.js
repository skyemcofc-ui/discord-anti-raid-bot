const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Ver estatísticas do bot anti-raid'),

  execute: async (interaction, client, db) => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const guildId = interaction.guildId;
      const stats = await db.get(
        'SELECT * FROM statistics WHERE guild_id = ?',
        [guildId]
      );

      const logsCount = await db.get(
        'SELECT COUNT(*) as count FROM raid_logs WHERE guild_id = ?',
        [guildId]
      );

      await interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: '📊 Estatísticas do Bot',
          fields: [
            {
              name: '💾 Memória',
              value: `Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB\nRSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
              inline: true
            },
            {
              name: '⏱️ Uptime',
              value: `${hours}h ${minutes}m ${seconds}s`,
              inline: true
            },
            {
              name: '🛡️ Raids Detectados',
              value: `${stats?.raids_detected || 0}`,
              inline: true
            },
            {
              name: '📋 Ações Executadas',
              value: `${logsCount?.count || 0}`,
              inline: true
            },
            {
              name: '👥 Servidores',
              value: `${client.guilds.cache.size}`,
              inline: true
            },
            {
              name: '👨 Usuários em Cache',
              value: `${client.users.cache.size}`,
              inline: true
            }
          ],
          timestamp: new Date()
        }]
      });
    } catch (error) {
      console.error('Erro:', error);
      interaction.reply({ content: '❌ Erro ao obter estatísticas.', ephemeral: true });
    }
  }
};
