const path = require('path');
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod-config')
    .setDescription('Configura los roles permitidos para enviar links sin restricciones')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Añadir un rol permitido')
        .addRoleOption(option =>
          option.setName('rol')
            .setDescription('Rol que podrá enviar links sin restricciones')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Quitar un rol permitido')
        .addRoleOption(option =>
          option.setName('rol')
            .setDescription('Rol que ya no podrá enviar links sin restricciones')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista los roles permitidos actuales')),
  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ Necesitas permiso de **Gestionar servidor** para usar este comando.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = client.config.db;

    if (subcommand === 'add') {
      const role = interaction.options.getRole('rol');

      db.run(
        `INSERT OR IGNORE INTO automod_roles (guild_id, role_id) VALUES (?, ?)`,
        [guildId, role.id],
        function(err) {
          if (err) {
            return interaction.reply({ content: '❌ Error al añadir el rol en la base de datos.', ephemeral: true });
          }
          interaction.reply({ content: `✅ Rol **${role.name}** añadido a la lista de roles permitidos para enviar links.`, ephemeral: true });
        }
      );
    }
    else if (subcommand === 'remove') {
      const role = interaction.options.getRole('rol');

      db.run(
        `DELETE FROM automod_roles WHERE guild_id = ? AND role_id = ?`,
        [guildId, role.id],
        function(err) {
          if (err) {
            return interaction.reply({ content: '❌ Error al quitar el rol de la base de datos.', ephemeral: true });
          }
          interaction.reply({ content: `✅ Rol **${role.name}** removido de la lista de roles permitidos.`, ephemeral: true });
        }
      );
    }
    else if (subcommand === 'list') {
      db.all(
        `SELECT role_id FROM automod_roles WHERE guild_id = ?`,
        [guildId],
        async (err, rows) => {
          if (err) {
            return interaction.reply({ content: '❌ Error al obtener la lista de roles.', ephemeral: true });
          }

          if (!rows.length) {
            return interaction.reply({ content: '⚠️ No hay roles permitidos configurados.', ephemeral: true });
          }

          const roles = rows.map(r => {
            const role = interaction.guild.roles.cache.get(r.role_id);
            return role ? role.name : `Rol no encontrado (${r.role_id})`;
          });

          const embed = new EmbedBuilder()
            .setTitle('Roles permitidos para enviar links')
            .setDescription(roles.join('\n'))
            .setColor('#00AAFF')
            .setTimestamp();

          interaction.reply({ embeds: [embed], ephemeral: true });
        }
      );
    }
  }
};
