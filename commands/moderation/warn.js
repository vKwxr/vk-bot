const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Advierte a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a advertir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón de la advertencia')
        .setRequired(true)),

  async execute(interaction, client) {
    // Verificar permisos
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: '❌ No tienes permisos para moderar miembros.',
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('usuario');
    const razon = interaction.options.getString('razon');
    const member = interaction.guild.members.cache.get(usuario.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Usuario no encontrado en el servidor.',
        ephemeral: true
      });
    }

    // No advertir a moderadores
    if (member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: '❌ No puedes advertir a un moderador.',
        ephemeral: true
      });
    }

    try {
      // Guardar advertencia en la base de datos
      const fecha = new Date().toISOString();
      
      client.config.db.run(
        `INSERT INTO warnings (user, reason, date) VALUES (?, ?, ?)`,
        [usuario.id, razon, fecha],
        function(err) {
          if (err) {
            console.error('Error al guardar advertencia:', err);
          }
        }
      );

      // Obtener número total de advertencias
      client.config.db.get(
        `SELECT COUNT(*) as total FROM warnings WHERE user = ?`,
        [usuario.id],
        async (err, row) => {
          const totalWarnings = row ? row.total : 1;

          const embed = new EmbedBuilder()
            .setTitle('⚠️ Usuario Advertido')
            .setDescription(`${usuario.tag} ha sido advertido`)
            .addFields(
              { name: '👤 Usuario', value: `${usuario.tag} (${usuario.id})`, inline: true },
              { name: '👮 Moderador', value: interaction.user.tag, inline: true },
              { name: '📝 Razón', value: razon, inline: false },
              { name: '🔢 Total Advertencias', value: totalWarnings.toString(), inline: true }
            )
            .setColor('#ffaa00')
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });

          // Enviar DM al usuario
          try {
            const dmEmbed = new EmbedBuilder()
              .setTitle('⚠️ Has recibido una advertencia')
              .setDescription(`Has sido advertido en **${interaction.guild.name}**`)
              .addFields(
                { name: '👮 Moderador', value: interaction.user.tag, inline: true },
                { name: '📝 Razón', value: razon, inline: false },
                { name: '🔢 Total Advertencias', value: totalWarnings.toString(), inline: true }
              )
              .setColor('#ffaa00')
              .setTimestamp();

            await usuario.send({ embeds: [dmEmbed] });
          } catch (error) {
            console.log('No se pudo enviar DM al usuario');
          }
        }
      );

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Error al advertir al usuario.',
        ephemeral: true
      });
    }
  },

  name: 'warn',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ No tienes permisos para moderar miembros.');
    }

    const usuario = message.mentions.users.first();
    if (!usuario) {
      return message.reply('❌ Menciona a un usuario válido.');
    }

    const razon = args.slice(1).join(' ');
    if (!razon) {
      return message.reply('❌ Especifica una razón para la advertencia.');
    }

    const member = message.guild.members.cache.get(usuario.id);
    if (!member) {
      return message.reply('❌ Usuario no encontrado en el servidor.');
    }

    if (member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ No puedes advertir a un moderador.');
    }

    try {
      const fecha = new Date().toISOString();
      
      client.config.db.run(
        `INSERT INTO warnings (user, reason, date) VALUES (?, ?, ?)`,
        [usuario.id, razon, fecha]
      );

      client.config.db.get(
        `SELECT COUNT(*) as total FROM warnings WHERE user = ?`,
        [usuario.id],
        async (err, row) => {
          const totalWarnings = row ? row.total : 1;

          const embed = new EmbedBuilder()
            .setTitle('⚠️ Usuario Advertido')
            .setDescription(`${usuario.tag} ha sido advertido`)
            .addFields(
              { name: '👤 Usuario', value: `${usuario.tag} (${usuario.id})`, inline: true },
              { name: '👮 Moderador', value: message.author.tag, inline: true },
              { name: '📝 Razón', value: razon, inline: false },
              { name: '🔢 Total Advertencias', value: totalWarnings.toString(), inline: true }
            )
            .setColor('#ffaa00')
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp();

          await message.reply({ embeds: [embed] });

          try {
            const dmEmbed = new EmbedBuilder()
              .setTitle('⚠️ Has recibido una advertencia')
              .setDescription(`Has sido advertido en **${message.guild.name}**`)
              .addFields(
                { name: '👮 Moderador', value: message.author.tag, inline: true },
                { name: '📝 Razón', value: razon, inline: false },
                { name: '🔢 Total Advertencias', value: totalWarnings.toString(), inline: true }
              )
              .setColor('#ffaa00')
              .setTimestamp();

            await usuario.send({ embeds: [dmEmbed] });
          } catch (error) {
            console.log('No se pudo enviar DM al usuario');
          }
        }
      );

    } catch (error) {
      console.error(error);
      message.reply('❌ Error al advertir al usuario.');
    }
  }
};
