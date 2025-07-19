
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('📊 Muestra información detallada del servidor'),

  async execute(interaction, client) {
    const guild = interaction.guild;
    
    const embed = new EmbedBuilder()
      .setTitle(`📊 Información de ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor('#9966ff')
      .addFields(
        { name: '🆔 ID del Servidor', value: guild.id, inline: true },
        { name: '👑 Propietario', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 Creado el', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Miembros', value: guild.memberCount.toString(), inline: true },
        { name: '💬 Canales', value: guild.channels.cache.size.toString(), inline: true },
        { name: '😀 Emojis', value: guild.emojis.cache.size.toString(), inline: true },
        { name: '🛡️ Nivel de Verificación', value: guild.verificationLevel.toString(), inline: true },
        { name: '🔒 Filtro de Contenido', value: guild.explicitContentFilter.toString(), inline: true },
        { name: '📈 Boost Level', value: guild.premiumTier.toString(), inline: true }
      )
      .setTimestamp();

    if (guild.banner) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed] });
  },

  name: 'serverinfo',
  async run(message, args, client) {
    const guild = message.guild;
    
    const embed = new EmbedBuilder()
      .setTitle(`📊 Información de ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor('#9966ff')
      .addFields(
        { name: '🆔 ID del Servidor', value: guild.id, inline: true },
        { name: '👑 Propietario', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 Creado el', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 Miembros', value: guild.memberCount.toString(), inline: true },
        { name: '💬 Canales', value: guild.channels.cache.size.toString(), inline: true },
        { name: '😀 Emojis', value: guild.emojis.cache.size.toString(), inline: true },
        { name: '🛡️ Nivel de Verificación', value: guild.verificationLevel.toString(), inline: true },
        { name: '🔒 Filtro de Contenido', value: guild.explicitContentFilter.toString(), inline: true },
        { name: '📈 Boost Level', value: guild.premiumTier.toString(), inline: true }
      )
      .setTimestamp();

    if (guild.banner) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await message.reply({ embeds: [embed] });
  }
};
