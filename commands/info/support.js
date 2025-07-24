const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Obtén el enlace del servidor de soporte oficial'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle('Servidor de Soporte Oficial')
      .setDescription('¡Únete a nuestro servidor oficial!')
      .addFields(
        { name: '📋 En el servidor puedes:', value: '• Reportar bugs\n• Solicitar funciones\n• Obtener soporte técnico\n• Conocer actualizaciones\n• Hablar con los desarrolladores', inline: false },
        { name: '🔗 Enlace directo:', value: 'https://discord.gg/3Nm8WsgmmU', inline: false }
      )
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL('https://discord.gg/3Nm8WsgmmU')
          .setLabel('Unirse al Servidor')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  name: 'support',
  async run(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle('🆘 Servidor de Soporte Oficial')
      .setDescription('¿Necesitas ayuda con el bot? ¡Únete a nuestro servidor oficial!')
      .addFields(
        { name: '📋 En el servidor puedes:', value: '• Reportar bugs\n• Solicitar funciones\n• Obtener soporte técnico\n• Conocer actualizaciones\n• Hablar con los desarrolladores', inline: false },
        { name: '🔗 Enlace directo:', value: 'https://discord.gg/3Nm8WsgmmU', inline: false }
      )
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setURL('https://discord.gg/3Nm8WsgmmU')
          .setLabel('Unirse al Servidor')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};
