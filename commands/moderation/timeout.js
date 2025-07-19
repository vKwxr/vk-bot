
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

function parseTime(timeString) {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const [, value, unit] = match;
  const num = parseInt(value);

  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('🔇 Aplica timeout a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a silenciar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Duración (ej: 5m, 1h, 2d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del timeout')
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: '❌ No tienes permisos para silenciar usuarios.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('usuario');
    const timeString = interaction.options.getString('tiempo');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    const duration = parseTime(timeString);
    if (!duration) {
      return interaction.reply({
        content: '❌ Formato de tiempo inválido. Usa: `10s`, `5m`, `2h`, `1d`',
        ephemeral: true
      });
    }

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({
        content: '❌ Usuario no encontrado en el servidor.',
        ephemeral: true
      });
    }

    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ No puedes silenciar al propietario del servidor.',
        ephemeral: true
      });
    }

    try {
      await member.timeout(duration, reason);

      const embed = new EmbedBuilder()
        .setTitle('🔇 Usuario Silenciado')
        .setColor('#e74c3c')
        .addFields(
          { name: '👤 Usuario', value: user.tag, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '⏰ Duración', value: timeString, inline: true },
          { name: '📝 Razón', value: reason, inline: false }
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        content: '❌ Error al silenciar al usuario.',
        ephemeral: true
      });
    }
  },

  name: 'mute',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ No tienes permisos para silenciar usuarios.');
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Debes mencionar a un usuario. Uso: `vkmute @usuario 10m razón`');

    const timeString = args[1];
    if (!timeString) return message.reply('❌ Debes especificar el tiempo.');

    const duration = parseTime(timeString);
    if (!duration) {
      return message.reply('❌ Formato de tiempo inválido. Usa: `10s`, `5m`, `2h`, `1d`');
    }

    const reason = args.slice(2).join(' ') || 'Sin razón especificada';
    const member = message.guild.members.cache.get(user.id);

    if (!member) return message.reply('❌ Usuario no encontrado.');

    if (member.id === message.guild.ownerId) {
      return message.reply('❌ No puedes silenciar al propietario del servidor.');
    }

    try {
      await member.timeout(duration, reason);
      const embed = new EmbedBuilder()
        .setTitle('🔇 Usuario Silenciado')
        .setColor('#e74c3c')
        .addFields(
          { name: '👤 Usuario', value: user.tag, inline: true },
          { name: '🛡️ Moderador', value: message.author.tag, inline: true },
          { name: '⏰ Duración', value: timeString, inline: true },
          { name: '📝 Razón', value: reason, inline: false }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Error al silenciar al usuario.');
    }
  }
};
