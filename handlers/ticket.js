
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType, AttachmentBuilder } = require('discord.js');

const TICKET_TYPES = [
  { id: "soporte", label: "🛠️ Soporte Técnico", description: "Problemas técnicos", emoji: "🛠️" },
  { id: "reporte", label: "🚨 Reportar Usuario", description: "Comportamiento inadecuado", emoji: "🚨" },
  { id: "sugerencia", label: "💡 Sugerencia", description: "Mejoras para el servidor", emoji: "💡" },
  { id: "apelacion", label: "⚖️ Apelación", description: "Apelar sanciones", emoji: "⚖️" },
  { id: "partnership", label: "🤝 Partnership", description: "Colaboraciones", emoji: "🤝" },
  { id: "otro", label: "❓ Otro", description: "Otras consultas", emoji: "❓" },
];

module.exports = {
  async execute(interaction, client) {
    const { ticketsDb, STAFF_ROLE_ID, ADMIN_ROLE_ID, TICKETS_CATEGORY_ID, TICKETS_LOGS_CHANNEL_ID } = client.config;

    if (interaction.customId === 'ticket_select') {
      const tipo = interaction.values[0];
      const userId = interaction.user.id;

      // Verificar si ya tiene un ticket abierto
      ticketsDb.get(
        `SELECT * FROM tickets WHERE user_id = ? AND status = 'abierto'`,
        [userId],
        async (err, row) => {
          if (row) {
            return interaction.reply({
              content: `❌ Ya tienes un ticket abierto: <#${row.channel_id}>`,
              ephemeral: true,
            });
          }

          // Crear canal de ticket
          const ticketName = `ticket-${tipo}-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, "");

          try {
            const ticketChannel = await interaction.guild.channels.create({
              name: ticketName,
              type: ChannelType.GuildText,
              parent: TICKETS_CATEGORY_ID || null,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: userId,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                  ],
                },
                {
                  id: STAFF_ROLE_ID,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages,
                  ],
                },
              ],
            });

            // Guardar en base de datos
            ticketsDb.run(
              `INSERT INTO tickets (user_id, channel_id, type, status, created_at, priority) VALUES (?, ?, ?, 'abierto', ?, 'normal')`,
              [userId, ticketChannel.id, tipo, new Date().toISOString()]
            );

            const welcomeEmbed = new EmbedBuilder()
              .setTitle("🎫 Ticket Creado")
              .setDescription(`¡Hola <@${userId}>! Tu ticket ha sido creado exitosamente.\n\n**📋 Tipo:** ${TICKET_TYPES.find(t => t.id === tipo)?.label}`)
              .setColor("#5865F2")
              .setTimestamp();

            const closeButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("ticket_close")
                .setLabel("Cerrar Ticket")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🔒")
            );

            await ticketChannel.send({
              content: `<@${userId}> <@&${STAFF_ROLE_ID}>`,
              embeds: [welcomeEmbed],
              components: [closeButton],
            });

            await interaction.reply({
              content: `✅ Ticket creado: ${ticketChannel}`,
              ephemeral: true,
            });
          } catch (error) {
            console.error(error);
            await interaction.reply({
              content: "❌ Error al crear el ticket.",
              ephemeral: true,
            });
          }
        }
      );
    }

    if (interaction.customId === 'ticket_close') {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({
          content: "❌ Este botón solo funciona en tickets.",
          ephemeral: true,
        });
      }

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_confirm_close")
          .setLabel("Confirmar")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId("ticket_cancel_close")
          .setLabel("Cancelar")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("❌")
      );

      await interaction.reply({
        content: "🔒 ¿Confirmas el cierre del ticket?",
        components: [confirmRow],
        ephemeral: true,
      });
    }

    if (interaction.customId === 'ticket_confirm_close') {
      await closeTicket(interaction.channel, interaction.user, "Cerrado por usuario", ticketsDb, client);
    }

    if (interaction.customId === 'ticket_cancel_close') {
      await interaction.reply({
        content: "❌ Cierre cancelado.",
        ephemeral: true,
      });
    }
  }
};

async function closeTicket(channel, user, reason, ticketsDb, client) {
  try {
    ticketsDb.get(
      `SELECT * FROM tickets WHERE channel_id = ?`,
      [channel.id],
      async (err, row) => {
        if (err || !row) return;

        // Actualizar estado
        ticketsDb.run(
          `UPDATE tickets SET status = 'cerrado', closed_at = ? WHERE channel_id = ?`,
          [new Date().toISOString(), channel.id]
        );

        // Crear transcripción
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages
          .filter(m => !m.author.bot)
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .map(msg => `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content || "[Adjunto/Embed]"}`)
          .join("\n");

        const buffer = Buffer.from(transcript, "utf-8");
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

        // Log
        const logsChannel = channel.guild.channels.cache.get(client.config.TICKETS_LOGS_CHANNEL_ID);
        if (logsChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🔒 Ticket Cerrado")
            .setDescription(`**Canal:** ${channel.name}\n**Cerrado por:** ${user}`)
            .setColor("#e74c3c")
            .setTimestamp();

          await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
        }

        await channel.send("🔒 Ticket cerrado. Eliminando en 5 segundos...");
        setTimeout(() => channel.delete().catch(console.error), 5000);
      }
    );
  } catch (error) {
    console.error(error);
  }
}
