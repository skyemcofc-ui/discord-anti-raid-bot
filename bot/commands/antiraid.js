const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configurar proteção anti-raid')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Ver status da proteção anti-raid')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('config')
        .setDescription('Configurar proteção anti-raid')
        .addIntegerOption(option =>
          option
            .setName('threshold')
            .setDescription('Número de entradas para ativar proteção (padrão: 5)')
            .setMinValue(1)
            .setMaxValue(100)
        )
        .addIntegerOption(option =>
          option
            .setName('timewindow')
            .setDescription('Segundos para contar entradas (padrão: 10)')
            .setMinValue(5)
            .setMaxValue(300)
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Ação a tomar (padrão: ban)')
            .addChoices(
              { name: 'Banir', value: 'ban' },
              { name: 'Expulsar', value: 'kick' },
              { name: 'Adicionar Role', value: 'role' }
            )
        )
    ),
  
  execute: async (interaction, client, db) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // Verificar permissões
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando!',
        ephemeral: true
      });
    }

    if (subcommand === 'status') {
      try {
        const settings = await db.get('SELECT * FROM guilds WHERE id = ?', [guildId]);
        const stats = await db.get('SELECT * FROM statistics WHERE guild_id = ?', [guildId]);

        if (!settings) {
          return interaction.reply({
            content: '❌ Servidor não configurado. Use `/antiraid config` primeiro.',
            ephemeral: true
          });
        }

        await interaction.reply({
          embeds: [{
            color: settings.antiraid_enabled ? 0x57F287 : 0xED4245,
            title: '🛡️ Status Anti-Raid',
            fields: [
              { name: 'Status', value: settings.antiraid_enabled ? '✅ Ativo' : '❌ Inativo', inline: true },
              { name: 'Limiar', value: `${settings.raid_threshold} entradas`, inline: true },
              { name: 'Janela de Tempo', value: `${settings.time_window}s`, inline: true },
              { name: 'Ação', value: settings.action.toUpperCase(), inline: true },
              { name: 'Raids Detectados', value: `${stats?.raids_detected || 0}`, inline: true },
              { name: 'Membros Banidos', value: `${stats?.members_banned || 0}`, inline: true }
            ],
            timestamp: new Date()
          }]
        });
      } catch (error) {
        console.error('Erro:', error);
        interaction.reply({ content: '❌ Erro ao obter status.', ephemeral: true });
      }
    }

    if (subcommand === 'config') {
      try {
        const threshold = interaction.options.getInteger('threshold') || 5;
        const timeWindow = interaction.options.getInteger('timewindow') || 10;
        const action = interaction.options.getString('action') || 'ban';

        const existing = await db.get('SELECT * FROM guilds WHERE id = ?', [guildId]);

        if (existing) {
          await db.run(
            'UPDATE guilds SET raid_threshold = ?, time_window = ?, action = ? WHERE id = ?',
            [threshold, timeWindow, action, guildId]
          );
        } else {
          await db.run(
            'INSERT INTO guilds (id, raid_threshold, time_window, action, antiraid_enabled) VALUES (?, ?, ?, ?, 1)',
            [guildId, threshold, timeWindow, action]
          );
        }

        await interaction.reply({
          embeds: [{
            color: 0x57F287,
            title: '✅ Configuração Salva',
            fields: [
              { name: 'Limiar', value: `${threshold} entradas`, inline: true },
              { name: 'Janela de Tempo', value: `${timeWindow}s`, inline: true },
              { name: 'Ação', value: action.toUpperCase(), inline: true }
            ]
          }]
        });
      } catch (error) {
        console.error('Erro:', error);
        interaction.reply({ content: '❌ Erro ao salvar configurações.', ephemeral: true });
      }
    }
  }
};
