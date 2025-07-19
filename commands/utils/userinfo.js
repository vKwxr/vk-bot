
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Muestra información detallada de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que quieres ver la información')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 Información de ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor('#9966ff')
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📅 Cuenta Creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Sí' : 'No', inline: true }
      );

    if (member) {
      embed.addFields(
        { name: '📥 Se Unió el', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: '🎭 Apodo', value: member.nickname || 'Ninguno', inline: true },
        { name: '🏷️ Roles', value: member.roles.cache.filter(role => role.id !== interaction.guild.id).map(role => role.toString()).join(' ') || 'Ninguno', inline: false }
      );
    }

    embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'userinfo',
  async run(message, args, client) {
    let user;
    if (args[0]) {
      const userId = args[0].replace(/[<@!>]/g, '');
      user = await client.users.fetch(userId).catch(() => null);
    }
    user = user || message.author;
    
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 Información de ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor('#9966ff')
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📅 Cuenta Creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Sí' : 'No', inline: true }
      );

    if (member) {
      embed.addFields(
        { name: '📥 Se Unió el', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: '🎭 Apodo', value: member.nickname || 'Ninguno', inline: true },
        { name: '🏷️ Roles', value: member.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.toString()).join(' ') || 'Ninguno', inline: false }
      );
    }

    embed.setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
