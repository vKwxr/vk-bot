
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

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
      .setTitle('🎫 Sistema de Tickets - VK')
      .setDescription('¿Necesitas ayuda? ¡Crea un ticket y nuestro equipo te atenderá!')
      .addFields(
        { name: '🛠️ Soporte Técnico', value: 'Problemas técnicos del servidor', inline: true },
        { name: '🚨 Reportar Usuario', value: 'Reportar comportamiento inadecuado', inline: true },
        { name: '💡 Sugerencias', value: 'Ideas para mejorar el servidor', inline: true },
        { name: '⚖️ Apelaciones', value: 'Apelar sanciones recibidas', inline: true },
        { name: '🤝 Partnership', value: 'Propuestas de colaboración', inline: true },
        { name: '❓ Otros', value: 'Cualquier otra consulta', inline: true },
        { name: '📋 Instrucciones', value: '1. Selecciona el tipo de ticket\n2. Espera a que se cree tu canal privado\n3. Explica tu situación detalladamente\n4. Un staff member te atenderá pronto', inline: false }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'VK Tickets • Sistema avanzado de soporte' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('🎫 Selecciona el tipo de ticket que necesitas')
      .addOptions([
        {
          label: 'Soporte Técnico',
          description: 'Problemas técnicos del servidor',
          value: 'soporte',
          emoji: '🛠️'
        },
        {
          label: 'Reportar Usuario',
          description: 'Comportamiento inadecuado',
          value: 'reporte',
          emoji: '🚨'
        },
        {
          label: 'Sugerencia',
          description: 'Ideas para mejorar',
          value: 'sugerencia',
          emoji: '💡'
        },
        {
          label: 'Apelación',
          description: 'Apelar sanciones',
          value: 'apelacion',
          emoji: '⚖️'
        },
        {
          label: 'Partnership',
          description: 'Colaboraciones',
          value: 'partnership',
          emoji: '🤝'
        },
        {
          label: 'Otro',
          description: 'Otras consultas',
          value: 'otro',
          emoji: '❓'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    try {
      await canal.send({ embeds: [embed], components: [row] });
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
