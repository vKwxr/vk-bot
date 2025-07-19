
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('📋 Ver las advertencias de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del cual ver las advertencias')
        .setRequired(false)),

  async execute(interaction, client) {
    // Verificar permisos
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: '❌ No tienes permisos para ver advertencias.',
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('usuario') || interaction.user;

    try {
      client.config.db.all(
        `SELECT * FROM warnings WHERE user = ? ORDER BY date DESC`,
        [usuario.id],
        async (err, rows) => {
          if (err) {
            console.error(err);
            return interaction.reply({
              content: '❌ Error al obtener las advertencias.',
              ephemeral: true
            });
          }

          if (!rows || rows.length === 0) {
            const embed = new EmbedBuilder()
              .setTitle('📋 Advertencias')
              .setDescription(`${usuario.tag} no tiene advertencias`)
              .setColor('#00ff00')
              .setThumbnail(usuario.displayAvatarURL())
              .setTimestamp();

            return interaction.reply({ embeds: [embed] });
          }

          const embed = new EmbedBuilder()
            .setTitle('📋 Advertencias')
            .setDescription(`${usuario.tag} tiene **${rows.length}** advertencia(s)`)
            .setColor('#ffaa00')
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp();

          // Mostrar las últimas 10 advertencias
          const warnings = rows.slice(0, 10);
          
          warnings.forEach((warning, index) => {
            const fecha = new Date(warning.date).toLocaleDateString('es-ES');
            embed.addFields({
              name: `⚠️ Advertencia #${index + 1}`,
              value: `**Razón:** ${warning.reason}\n**Fecha:** ${fecha}`,
              inline: false
            });
          });

          if (rows.length > 10) {
            embed.setFooter({ text: `Mostrando 10 de ${rows.length} advertencias` });
          }

          await interaction.reply({ embeds: [embed] });
        }
      );

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Error al obtener las advertencias.',
        ephemeral: true
      });
    }
  },

  name: 'warnings',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ No tienes permisos para ver advertencias.');
    }

    let usuario = message.mentions.users.first();
    if (!usuario && args[0]) {
      try {
        usuario = await message.client.users.fetch(args[0]);
      } catch (error) {
        return message.reply('❌ Usuario no encontrado.');
      }
    }
    if (!usuario) usuario = message.author;

    try {
      client.config.db.all(
        `SELECT * FROM warnings WHERE user = ? ORDER BY date DESC`,
        [usuario.id],
        async (err, rows) => {
          if (err) {
            console.error(err);
            return message.reply('❌ Error al obtener las advertencias.');
          }

          if (!rows || rows.length === 0) {
            const embed = new EmbedBuilder()
              .setTitle('📋 Advertencias')
              .setDescription(`${usuario.tag} no tiene advertencias`)
              .setColor('#00ff00')
              .setThumbnail(usuario.displayAvatarURL())
              .setTimestamp();

            return message.reply({ embeds: [embed] });
          }

          const embed = new EmbedBuilder()
            .setTitle('📋 Advertencias')
            .setDescription(`${usuario.tag} tiene **${rows.length}** advertencia(s)`)
            .setColor('#ffaa00')
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp();

          const warnings = rows.slice(0, 10);
          
          warnings.forEach((warning, index) => {
            const fecha = new Date(warning.date).toLocaleDateString('es-ES');
            embed.addFields({
              name: `⚠️ Advertencia #${index + 1}`,
              value: `**Razón:** ${warning.reason}\n**Fecha:** ${fecha}`,
              inline: false
            });
          });

          if (rows.length > 10) {
            embed.setFooter({ text: `Mostrando 10 de ${rows.length} advertencias` });
          }

          await message.reply({ embeds: [embed] });
        }
      );

    } catch (error) {
      console.error(error);
      message.reply('❌ Error al obtener las advertencias.');
    }
  }
};
