const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Gerenciar lista branca de usuários')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Adicionar usuário à lista branca')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Usuário a adicionar')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Motivo (opcional)')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remover usuário da lista branca')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('Usuário a remover')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Listar usuários na lista branca')
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

    if (subcommand === 'add') {
      try {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Nenhum motivo fornecido';

        await db.run(
          'INSERT OR IGNORE INTO whitelist (guild_id, user_id, reason) VALUES (?, ?, ?)',
          [guildId, user.id, reason]
        );

        await interaction.reply({
          embeds: [{
            color: 0x57F287,
            title: '✅ Usuário Adicionado à Lista Branca',
            fields: [
              { name: 'Usuário', value: `<@${user.id}>`, inline: true },
              { name: 'Motivo', value: reason, inline: false }
            ]
          }]
        });
      } catch (error) {
        console.error('Erro:', error);
        interaction.reply({ content: '❌ Erro ao adicionar à lista branca.', ephemeral: true });
      }
    }

    if (subcommand === 'remove') {
      try {
        const user = interaction.options.getUser('user');

        await db.run(
          'DELETE FROM whitelist WHERE guild_id = ? AND user_id = ?',
          [guildId, user.id]
        );

        await interaction.reply({
          embeds: [{
            color: 0x57F287,
            title: '✅ Usuário Removido da Lista Branca',
            fields: [
              { name: 'Usuário', value: `<@${user.id}>`, inline: true }
            ]
          }]
        });
      } catch (error) {
        console.error('Erro:', error);
        interaction.reply({ content: '❌ Erro ao remover da lista branca.', ephemeral: true });
      }
    }

    if (subcommand === 'list') {
      try {
        const whitelist = await db.all(
          'SELECT * FROM whitelist WHERE guild_id = ?',
          [guildId]
        );

        if (whitelist.length === 0) {
          return interaction.reply({
            content: '📋 A lista branca está vazia.',
            ephemeral: true
          });
        }

        const fields = whitelist.map(entry => ({
          name: `<@${entry.user_id}>`,
          value: entry.reason,
          inline: false
        }));

        await interaction.reply({
          embeds: [{
            color: 0x5865F2,
            title: '📋 Lista Branca',
            fields: fields.slice(0, 25) // Discord limit
          }]
        });
      } catch (error) {
        console.error('Erro:', error);
        interaction.reply({ content: '❌ Erro ao listar lista branca.', ephemeral: true });
      }
    }
  }
};
