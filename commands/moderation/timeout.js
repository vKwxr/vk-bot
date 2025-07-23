const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

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

      return interaction.reply({
        content: `🔇 **${user.tag}** ha sido silenciado por **${interaction.user.tag}**\n⏰ Duración: \`${timeString}\`\n📝 Razón: ${reason}`,
        ephemeral: false
      });
    } catch (error) {
      return interaction.reply({
        content: '❌ Error al silenciar al usuario.',
        ephemeral: true
      });
    }
  },

  name: 'timeout',
  async run(message, args, client, prefix) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ No tienes permisos para silenciar usuarios.');
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply(`❌ Debes mencionar a un usuario. Uso: \`${prefix}timeout @usuario 10m razón\``);

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

      return message.channel.send(`🔇 **${user.tag}** ha sido silenciado por **${message.author.tag}**\n⏰ Duración: \`${timeString}\`\n📝 Razón: ${reason}`);
    } catch (error) {
      return message.reply('❌ Error al silenciar al usuario.');
    }
  },

  async autoTimeoutOnReply(message, prefix) {
    if (!message.guild) return;
    if (message.author.bot) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    if (!message.reference) return;

    if (!message.content.startsWith(prefix)) return;

    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (!repliedMessage) return;

    if (repliedMessage.member?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    if (repliedMessage.author.id === message.guild.ownerId) return;

    const muteDuration = 10 * 60 * 1000; // 10 min
    const reason = `Mute automático por responder con comando del staff ${message.author.tag}`;

    try {
      await repliedMessage.member.timeout(muteDuration, reason);

      await message.channel.send(`🔇 **${repliedMessage.author.tag}** ha sido silenciado automáticamente por responder a un comando de staff.\n⏰ Duración: 10 minutos\n📝 Razón: ${reason}`);
    } catch {
    }
  }
};
