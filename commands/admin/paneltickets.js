const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

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
      .setTitle('🎫 Sistema de Tickets - VK Community')
      .setDescription('¡Bienvenido al sistema de tickets de VK Community!\n\n📋 **¿Cómo funciona?**\n1️⃣ Selecciona el tipo de ticket apropiado\n2️⃣ Confirma la creación del ticket\n3️⃣ Proporciona información detallada sobre tu consulta\n4️⃣ Espera a que un miembro del staff te atienda\n\n⚠️ **IMPORTANTE**\n• Solo crea tickets si realmente necesitas ayuda\n• Los tickets falsos o de broma pueden resultar en **sanciones**\n• Un usuario puede tener máximo **1 ticket abierto**\n• Los tickets se eliminan automáticamente tras cerrarlos')
      .addFields(
        { 
          name: '🛠️ Soporte Técnico', 
          value: '• Problemas con comandos del bot\n• Errores técnicos del servidor\n• Configuraciones que no funcionan', 
          inline: true 
        },
        { 
          name: '🚨 Reportar Usuario', 
          value: '• Comportamiento inadecuado\n• Spam o toxicidad\n• Incumplimiento de reglas', 
          inline: true 
        },
        { 
          name: '💡 Sugerencias', 
          value: '• Ideas para mejorar el servidor\n• Nuevas funciones del bot\n• Propuestas de eventos', 
          inline: true 
        },
        { 
          name: '⚖️ Apelaciones', 
          value: '• Apelar warns o bans\n• Disputar sanciones\n• Solicitar revisión de casos', 
          inline: true 
        },
        { 
          name: '🤝 Partnership', 
          value: '• Colaboraciones con otros servidores\n• Propuestas de alianzas\n• Intercambios promocionales', 
          inline: true 
        },
        { 
          name: '🛒 Recompensas de Tienda', 
          value: '• Reclamar roles comprados\n• Problemas con compras\n• Solicitar recompensas', 
          inline: true 
        },
        { 
          name: '❓ Otras Consultas', 
          value: '• Preguntas generales\n• Dudas sobre el servidor\n• Consultas no categorizadas', 
          inline: true 
        },
        {
          name: '⏰ Horarios de Atención',
          value: 'Los tickets son atendidos **24/7** por nuestro equipo de staff',
          inline: false
        }
      )
      .setColor('#5865F2')
      .setImage('https://i.imgur.com/tickets-banner.png')
      .setThumbnail('https://cdn.discordapp.com/emojis/ticket-emoji.png')
      .setFooter({ text: 'VK Community • Sistema de Tickets Avanzado • Creado por VK Team' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('🎫 Selecciona el tipo de ticket...')
      .addOptions([
        {
          label: 'Soporte Técnico',
          description: 'Problemas técnicos con el bot o servidor',
          value: 'soporte',
          emoji: '🛠️'
        },
        {
          label: 'Reportar Usuario',
          description: 'Reportar comportamiento inadecuado',
          value: 'reporte',
          emoji: '🚨'
        },
        {
          label: 'Sugerencia',
          description: 'Proponer mejoras para el servidor',
          value: 'sugerencia',
          emoji: '💡'
        },
        {
          label: 'Apelación',
          description: 'Apelar warns, bans o sanciones',
          value: 'apelacion',
          emoji: '⚖️'
        },
        {
          label: 'Partnership',
          description: 'Propuestas de colaboración',
          value: 'partnership',
          emoji: '🤝'
        },
        {
          label: 'Recompensas de Tienda',
          description: 'Reclamar compras realizadas en /shop',
          value: 'recompensa',
          emoji: '🛒'
        },
        {
          label: 'Otras Consultas',
          description: 'Cualquier otra pregunta o consulta',
          value: 'otro',
          emoji: '❓'
        }
      ]);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    try {
      await canal.send({ embeds: [embed], components: [selectRow] });
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