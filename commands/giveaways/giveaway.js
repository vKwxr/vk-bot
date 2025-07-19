
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Crear un sorteo automático')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal donde se publicará')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título del sorteo')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('premio')
        .setDescription('Premio del sorteo')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duracion')
        .setDescription('Duración (ej: 2h, 1d)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('ganadores')
        .setDescription('Número de ganadores')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10))
    .addRoleOption(option =>
      option.setName('rol_requerido')
        .setDescription('Rol requerido para participar')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('invites_minimas')
        .setDescription('Invitaciones mínimas requeridas')
        .setRequired(false)
        .setMinValue(0))
    .addStringOption(option =>
      option.setName('imagen')
        .setDescription('URL de imagen (opcional)')
        .setRequired(false)),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Solo administradores pueden crear sorteos.',
        ephemeral: true
      });
    }

    const canal = interaction.options.getChannel('canal');
    const titulo = interaction.options.getString('titulo');
    const premio = interaction.options.getString('premio');
    const duracion = interaction.options.getString('duracion');
    const ganadores = interaction.options.getInteger('ganadores') || 1;
    const rolRequerido = interaction.options.getRole('rol_requerido');
    const invitesMinimas = interaction.options.getInteger('invites_minimas') || 0;
    const imagen = interaction.options.getString('imagen');

    // Validar duración
    const timeMatch = duracion.match(/^(\d+)([hd])$/);
    if (!timeMatch) {
      return interaction.reply({
        content: '❌ Formato de duración inválido. Usa `2h` o `1d`.',
        ephemeral: true
      });
    }

    const [, time, unit] = timeMatch;
    const ms = unit === 'h' ? parseInt(time) * 60 * 60 * 1000 : parseInt(time) * 24 * 60 * 60 * 1000;
    const finaliza = Date.now() + ms;

    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${titulo}`)
      .setDescription(`
**🎁 Premio:** ${premio}
**👥 Ganadores:** ${ganadores}
**⏰ Finaliza:** <t:${Math.floor(finaliza / 1000)}:R>
${rolRequerido ? `**🎭 Rol requerido:** ${rolRequerido}` : ''}
${invitesMinimas > 0 ? `**📨 Invitaciones mínimas:** ${invitesMinimas}` : ''}

👥 Participantes: **0**

¡Haz clic en el botón para participar!`)
      .setColor('#ffb300')
      .setFooter({ text: 'Sorteo VK Community' })
      .setTimestamp();

    if (imagen && imagen.startsWith('http')) {
      embed.setImage(imagen);
    }

    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_join')
          .setLabel('🎉 Participar')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎉')
      );

    const message = await canal.send({
      content: rolRequerido ? `${rolRequerido}` : '@everyone',
      embeds: [embed],
      components: [button]
    });

    // Guardar en DB
    client.config.sorteosDb.run(
      `INSERT INTO sorteos (channel_id, message_id, titulo, premio, rol_requerido, finaliza, imagen, ganadores_cantidad, min_invites, participantes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [canal.id, message.id, titulo, premio, rolRequerido?.id, finaliza, imagen, ganadores, invitesMinimas, '[]']
    );

    await interaction.reply({
      content: '✅ Sorteo creado correctamente.',
      ephemeral: true
    });

    // Programar finalización
    setTimeout(async () => {
      await finalizarSorteo(client, message.id);
    }, ms);
  }
};

async function finalizarSorteo(client, messageId) {
  try {
    client.config.sorteosDb.get(
      `SELECT * FROM sorteos WHERE message_id = ?`,
      [messageId],
      async (err, sorteo) => {
        if (err || !sorteo) return;

        const canal = await client.channels.fetch(sorteo.channel_id);
        const mensaje = await canal.messages.fetch(messageId);
        
        const participantes = JSON.parse(sorteo.participantes || '[]');
        
        // Verificar roles y invitaciones
        const participantesValidos = [];
        for (const userId of participantes) {
          try {
            const member = canal.guild.members.cache.get(userId);
            if (!member) continue;

            // Verificar rol
            if (sorteo.rol_requerido && !member.roles.cache.has(sorteo.rol_requerido)) {
              continue;
            }

            // Verificar invitaciones
            if (sorteo.min_invites > 0) {
              const inviteRow = await new Promise(resolve => {
                client.config.db.get(
                  `SELECT current_invites FROM user_invites WHERE user_id = ?`,
                  [userId],
                  (err, row) => resolve(row)
                );
              });
              
              const userInvites = inviteRow ? inviteRow.current_invites : 0;
              if (userInvites < sorteo.min_invites) continue;
            }

            participantesValidos.push(userId);
          } catch (error) {
            console.error('Error validando participante:', error);
          }
        }

        let ganadores = [];
        if (participantesValidos.length > 0) {
          const numGanadores = Math.min(sorteo.ganadores_cantidad, participantesValidos.length);
          
          for (let i = 0; i < numGanadores; i++) {
            const randomIndex = Math.floor(Math.random() * participantesValidos.length);
            ganadores.push(participantesValidos.splice(randomIndex, 1)[0]);
          }
        }

        // Actualizar embed
        const finalEmbed = new EmbedBuilder()
          .setTitle('🎉 Sorteo Finalizado')
          .setDescription(
            ganadores.length > 0
              ? `**🎁 Premio:** ${sorteo.premio}\n**🏆 ${ganadores.length > 1 ? 'Ganadores' : 'Ganador'}:** ${ganadores.map(id => `<@${id}>`).join(', ')}`
              : '❌ No hubo participantes válidos.'
          )
          .setColor('#43e97b')
          .setFooter({ text: 'Sorteo VK Community' })
          .setTimestamp();

        if (sorteo.imagen && sorteo.imagen.startsWith('http')) {
          finalEmbed.setImage(sorteo.imagen);
        }

        await mensaje.edit({ 
          content: ganadores.length > 0 ? `🎉 ${ganadores.map(id => `<@${id}>`).join(' ')}` : '@everyone',
          embeds: [finalEmbed], 
          components: [] 
        });

        // Reiniciar invitaciones de participantes
        if (sorteo.min_invites > 0) {
          client.config.db.run(`UPDATE user_invites SET current_invites = 0`);
        }
      }
    );
  } catch (error) {
    console.error('Error finalizando sorteo:', error);
  }
}
