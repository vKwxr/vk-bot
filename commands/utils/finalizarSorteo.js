const path = require('path');
const { EmbedBuilder } = require('discord.js');

async function finalizarSorteo(client, messageId) {
  try {
    client.config.sorteosDb.get(
      `SELECT * FROM sorteos WHERE message_id = ?`,
      [messageId],
      async (err, sorteo) => {
        if (err || !sorteo) return;

        const canal = await client.channels.fetch(sorteo.channel_id).catch(() => null);
        if (!canal) return;

        const mensaje = await canal.messages.fetch(messageId).catch(() => null);
        if (!mensaje) return;

        const participantes = JSON.parse(sorteo.participantes || '[]');
        const participantesValidos = [];

        for (const userId of participantes) {
          try {
            const member = await canal.guild.members.fetch(userId).catch(() => null);
            if (!member) continue;

            if (sorteo.rol_requerido && !member.roles.cache.has(sorteo.rol_requerido)) continue;

            if (sorteo.min_invites > 0) {
              const inviteRow = await new Promise((resolve) => {
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

        const finalEmbed = new EmbedBuilder()
          .setTitle('🎉 Sorteo Finalizado')
          .setDescription(
            `El sorteo por **${sorteo.premio}** ha finalizado.\n\n` +
            (ganadores.length > 0
              ? `🎊 **Ganadores:**\n${ganadores.map((id) => `<@${id}>`).join('\n')}`
              : `😢 No hubo participantes válidos.`)
          )
          .setColor('Gold')
          .setTimestamp();

        await mensaje.edit({ embeds: [finalEmbed] });

        if (ganadores.length > 0) {
          try {
            await canal.send({
              content: `🎉 Felicidades ${ganadores.map((id) => `<@${id}>`).join(', ')}\n¡Has ganado **${sorteo.premio}**!`,
              allowedMentions: { users: ganadores }
            });
          } catch (err) {
            console.error('Error al anunciar ganadores:', err);
          }
        }
      }
    );
  } catch (error) {
    console.error('Error al finalizar sorteo:', error);
  }
}

module.exports = finalizarSorteo;
