const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paneltickets')
    .setDescription('🎫 Crear panel de tickets para el servidor')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde crear el panel')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Solo los administradores pueden usar este comando.',
        ephemeral: true
      });
    }

    const canal = interaction.options.getChannel('canal');

    const embed = new EmbedBuilder()
      .setTitle('🎫 VK Tickets')
      .setDescription('Crea un ticket para obtener soporte del staff')
      .addFields(
        { name: '🔧 Soporte Técnico', value: 'Problemas con el bot o servidor', inline: true },
        { name: '📋 Soporte General', value: 'Preguntas generales', inline: true },
        { name: '⚠️ Reportes', value: 'Reportar usuarios o problemas', inline: true },
        { name: '🛒 Recompensas', value: 'Reclamar compras de la tienda', inline: true }
      )
      .setColor('#0099ff')
      .setFooter({ text: 'VK Tickets • Selecciona una categoría' })
      .setTimestamp();

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_soporte')
          .setLabel('🔧 Soporte Técnico')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_general')
          .setLabel('📋 Soporte General')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ticket_reporte')
          .setLabel('⚠️ Reportes')
          .setStyle(ButtonStyle.Danger)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_recompensa')
          .setLabel('🛒 Recompensas')
          .setStyle(ButtonStyle.Success)
      );

    try {
      await canal.send({ embeds: [embed], components: [row1, row2] });
      await interaction.reply({
        content: `✅ Panel de tickets creado exitosamente en ${canal}`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Error al crear el panel de tickets.',
        ephemeral: true
      });
    }
  }
};