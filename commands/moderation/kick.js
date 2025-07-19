
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Expulsa a un usuario del servidor')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a expulsar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón de la expulsión')
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({
        content: '❌ No tienes permisos para expulsar usuarios.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Usuario no encontrado en el servidor.',
        ephemeral: true
      });
    }

    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ No puedes expulsar al propietario del servidor.',
        ephemeral: true
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: '❌ No puedes expulsar a este usuario (rol superior o igual).',
        ephemeral: true
      });
    }

    try {
      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setTitle('👢 Usuario Expulsado')
        .setColor('#f39c12')
        .addFields(
          { name: '👤 Usuario', value: user.tag, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📝 Razón', value: reason, inline: false }
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        content: '❌ Error al expulsar al usuario.',
        ephemeral: true
      });
    }
  },

  name: 'kick',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ No tienes permisos para expulsar usuarios.');
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Debes mencionar a un usuario.');

    const reason = args.slice(1).join(' ') || 'Sin razón especificada';
    const member = message.guild.members.cache.get(user.id);

    if (!member) return message.reply('❌ Usuario no encontrado.');

    if (member.id === message.guild.ownerId) {
      return message.reply('❌ No puedes expulsar al propietario del servidor.');
    }

    try {
      await member.kick(reason);
      const embed = new EmbedBuilder()
        .setTitle('👢 Usuario Expulsado')
        .setColor('#f39c12')
        .addFields(
          { name: '👤 Usuario', value: user.tag, inline: true },
          { name: '🛡️ Moderador', value: message.author.tag, inline: true },
          { name: '📝 Razón', value: reason, inline: false }
        )
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      await message.reply('❌ Error al expulsar al usuario.');
    }
  }
};
