const path = require('path');

const { EmbedBuilder } = require('discord.js');

module.exports = {
  async execute(interaction, client) {
    const { sorteosDb } = client.config;
    
    if (interaction.customId === 'giveaway_join') {
      // Verificar si el sorteo existe
      sorteosDb.get(
        `SELECT * FROM sorteos WHERE message_id = ?`,
        [interaction.message.id],
        async (err, sorteo) => {
          if (err || !sorteo) {
            return interaction.reply({
              content: '❌ Error: Sorteo no encontrado.',
              ephemeral: true
            });
          }

          // Verificar si ya terminó
          if (Date.now() > sorteo.finaliza) {
            return interaction.reply({
              content: '❌ Este sorteo ya ha terminado.',
              ephemeral: true
            });
          }

          const participantes = JSON.parse(sorteo.participantes || '[]');
          const userId = interaction.user.id;

          // Verificar rol requerido
          if (sorteo.rol_requerido) {
            const member = interaction.guild.members.cache.get(userId);
            if (!member.roles.cache.has(sorteo.rol_requerido)) {
              return interaction.reply({
                content: '❌ No tienes el rol requerido para participar en este sorteo.',
                ephemeral: true
              });
            }
          }

          // Verificar invitaciones mínimas
          if (sorteo.min_invites > 0) {
            client.config.db.get(
              `SELECT current_invites FROM user_invites WHERE user_id = ?`,
              [userId],
              async (err, row) => {
                const userInvites = row ? row.current_invites : 0;
                if (userInvites < sorteo.min_invites) {
                  return interaction.reply({
                    content: `❌ Necesitas al menos ${sorteo.min_invites} invitaciones para participar. Tienes ${userInvites}.`,
                    ephemeral: true
                  });
                }
                
                await processParticipation();
              }
            );
          } else {
            await processParticipation();
          }

          async function processParticipation() {
            if (participantes.includes(userId)) {
              // Remover participación
              const index = participantes.indexOf(userId);
              participantes.splice(index, 1);
              
              sorteosDb.run(
                `UPDATE sorteos SET participantes = ? WHERE message_id = ?`,
                [JSON.stringify(participantes), interaction.message.id]
              );

              await interaction.reply({
                content: '❌ Te has retirado del sorteo.',
                ephemeral: true
              });
            } else {
              // Añadir participación
              participantes.push(userId);
              
              sorteosDb.run(
                `UPDATE sorteos SET participantes = ? WHERE message_id = ?`,
                [JSON.stringify(participantes), interaction.message.id]
              );

              await interaction.reply({
                content: '✅ ¡Te has unido al sorteo!',
                ephemeral: true
              });
            }

            // Actualizar embed
            const embed = EmbedBuilder.from(interaction.message.embeds[0])
              .setDescription(
                interaction.message.embeds[0].description.replace(
                  /👥 Participantes: \*\*\d+\*\*/,
                  `👥 Participantes: **${participantes.length}**`
                )
              );

            await interaction.message.edit({ embeds: [embed] });
          }
        }
      );
    }
  }
};
