const { ChannelType } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  execute: async (member, client, db) => {
    try {
      const guild = member.guild;
      const guildSettings = await db.get('SELECT * FROM guilds WHERE id = ?', [guild.id]);

      if (!guildSettings || !guildSettings.antiraid_enabled) return;

      // Registrar entrada
      await db.run(
        'INSERT INTO join_tracker (guild_id, user_id) VALUES (?, ?)',
        [guild.id, member.id]
      );

      // Verificar se está na whitelist
      const whitelisted = await db.get(
        'SELECT * FROM whitelist WHERE guild_id = ? AND user_id = ?',
        [guild.id, member.id]
      );

      if (whitelisted) return;

      // Detecção de raid
      const timeWindow = guildSettings.time_window * 1000; // Converter para ms
      const recentJoins = await db.all(`
        SELECT * FROM join_tracker 
        WHERE guild_id = ? 
        AND join_time > datetime('now', '-' || ? || ' seconds')
      `, [guild.id, guildSettings.time_window]);

      if (recentJoins.length >= guildSettings.raid_threshold) {
        await executeRaidAction(member, guild, db, guildSettings);
      }

      // Limpar entradas antigas
      await db.run(
        'DELETE FROM join_tracker WHERE join_time < datetime("now", "-1 hour")'
      );

    } catch (error) {
      console.error('❌ Erro em guildMemberAdd:', error);
    }
  }
};

async function executeRaidAction(member, guild, db, settings) {
  try {
    const reason = '🛡️ Detectado possível raid no servidor';

    switch (settings.action) {
      case 'ban':
        await member.ban({ reason });
        break;
      case 'kick':
        await member.kick(reason);
        break;
      case 'role':
        if (settings.verified_role) {
          const role = guild.roles.cache.get(settings.verified_role);
          if (role) await member.roles.add(role);
        }
        break;
    }

    // Registrar no banco
    await db.run(
      'INSERT INTO raid_logs (guild_id, user_id, action, reason) VALUES (?, ?, ?, ?)',
      [guild.id, member.id, settings.action, reason]
    );

    // Enviar log
    if (settings.logs_channel) {
      const logsChannel = guild.channels.cache.get(settings.logs_channel);
      if (logsChannel && logsChannel.isTextBased()) {
        await logsChannel.send({
          embeds: [{
            color: 0xFF0000,
            title: '⚠️ Ação Anti-Raid Executada',
            fields: [
              { name: 'Usuário', value: `<@${member.id}>`, inline: true },
              { name: 'Ação', value: settings.action.toUpperCase(), inline: true },
              { name: 'Motivo', value: reason, inline: false }
            ],
            timestamp: new Date()
          }]
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro ao executar ação anti-raid:', error);
  }
}
