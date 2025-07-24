const path = require('path');
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
   if (
  !interaction.inGuild() ||
  !interaction.member ||
  !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
) {
  return interaction.reply({
    content: '❌ Este comando solo puede usarse en un servidor y requiere permisos de administrador.',
    ephemeral: true
  });
}


    const canal = interaction.options.getChannel('canal');

    if (canal.type !== 0) { 
      return interaction.reply({
        content: '❌ El canal debe ser un canal de texto.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets')
.setDescription(`¡Bienvenido/a al centro de soporte de nuestra comunidad!

Aquí podrás ponerte en contacto con el equipo de moderación y soporte para resolver cualquier duda, problema o solicitud que tengas relacionada con el servidor.

📬 Nuestro equipo revisará tu ticket lo antes posible. Por favor, selecciona a continuación el tipo de asistencia que necesitas:`)

      .setColor('#5865F2')
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
          description: 'Reportar comportamiento inadecuado de un usuario',
          value: 'reporte',
          emoji: '🚨'
        },
        {
          label: 'Sugerencia',
          description: 'Proponer ideas al staff para mejorar el servidor o bot',
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
