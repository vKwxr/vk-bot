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
    // Solo permisos de Administrador en ese servidor
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Solo los administradores pueden usar este comando.',
        ephemeral: true
      });
    }

    const canal = interaction.options.getChannel('canal');

    // Verifica que el canal sea un canal de texto
    if (canal.type !== 0) { // 0 es texto en discord.js v14
      return interaction.reply({
        content: '❌ El canal debe ser un canal de texto.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets - vK Bot')
      .setDescription('¡Bienvenido/a al sistema de tickets de nuestra guild\n\nAqui te puedes poner en contcto con el staff para resolver cualquier duda o problema que tengas\n\nselecciona en el menu de abajo cual es tu problema o consulta ')
      .addFields(
        { 
          name: '🛠️ Soporte Técnico', 
          value: '• Problemas con comandos del bot\n• Errores técnicos del servidor\n• Configuraciones que no funcionan', 
          inline: false 
        },
        { 
          name: '🚨 Reportar Usuario', 
          value: '• Comportamiento inadecuado\n• Spam o toxicidad\n• Incumplimiento de reglas', 
          inline: false 
        },
        { 
          name: '💡 Sugerencias', 
          value: '• Ideas para mejorar el servidor\n• Nuevas funciones del bot\n• Propuestas de eventos/sorteos', 
          inline: false 
        },
        { 
          name: '⚖️ Apelaciones', 
          value: '• Apelar warns o bans\n• Disputar sanciones\n• Solicitar revisión de casos', 
          inline: false 
        },
        { 
          name: '🤝 Partnership', 
          value: '• Colaboraciones con otros servidores\n• Propuestas de alianzas\n• Intercambios promocionales', 
          inline: false 
        },
        { 
          name: '🛒 Recompensas de Tienda', 
          value: '• Reclamar roles comprados\n• Problemas con compras\n• Solicitar recompensas', 
          inline: false 
        },
        { 
          name: '❓ Otras Consultas', 
          value: '• Preguntas generales\n• Dudas sobre el servidor\n• Consultas no categorizadas', 
          inline: false 
        },
        {
          name: '⏰ Horarios de Atención',
          value: 'Los tickets son atendidos **24/7** por nuestro equipo de staff',
          inline: false
        }
      )
      .setColor('#5865F2')
      .setImage('https://images-ext-1.discordapp.net/external/db8Y95263mlJkVPkfhxScjHnr03h3oGOujbEjdc8-2Y/https/media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyaXE1bzB0NGcxazB3aGFrcTI0aGt6ZTlwMHc1bHgyamFuM3BoYTdsdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7NeoMpmd7Ie9l1cO5c/giphy.gif')
      .setThumbnail('https://cdn.discordapp.com/emojis/ticket-emoji.png')
      .setFooter({ text: 'vK Bot' })
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
          description: 'Proponer ideas al staff',
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
