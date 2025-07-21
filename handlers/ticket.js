

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType, AttachmentBuilder, StringSelectMenuBuilder, flatten } = require('discord.js');

const TICKET_TYPES = [
  { id: "soporte", label: "🛠️ Soporte Técnico", description: "Problemas técnicos", emoji: "🛠️" },
  { id: "reporte", label: "🚨 Reportar Usuario", description: "Comportamiento inadecuado", emoji: "🚨" },
  { id: "sugerencia", label: "💡 Sugerencia", description: "Mejoras para el servidor", emoji: "💡" },
  { id: "apelacion", label: "⚖️ Apelación", description: "Apelar sanciones", emoji: "⚖️" },
  { id: "partnership", label: "🤝 Partnership", description: "Colaboraciones", emoji: "🤝" },
  { id: "recompensa", label: "🛒 Recompensas", description: "Reclamar compras de la tienda", emoji: "🛒" },
  { id: "otro", label: "❓ Otro", description: "Otras consultas", emoji: "❓" },
];

module.exports = {
  async execute(interaction, client) {
    const sqlite3 = require("sqlite3").verbose();
    const path = require("path");
    const ticketsDb = new sqlite3.Database(path.join(__dirname, "../tickets.sqlite"));
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    // Obtener configuración del servidor desde la base de datos
    const getConfig = () => new Promise((resolve, reject) => {
      ticketsDb.get("SELECT * FROM ticket_configs WHERE guild_id = ?", [guildId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const config = await getConfig();
    if (!config) {
      return interaction.reply({ content: "⚠️ El servidor no tiene configuración de tickets. Usa el panel de administración.", ephemeral: true });
    }

    const staffRoleId = config.staff_role_id;
    const categoryId = config.category_id;

    // Verificar si ya tiene un ticket abierto en este servidor
    const ticketExists = await new Promise((resolve, reject) => {
      ticketsDb.get(
        "SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status = 'open'",
        [userId, guildId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (ticketExists) {
      return interaction.reply({ content: "❌ Ya tienes un ticket abierto .", ephemeral: true });
    }

    const { STAFF_ROLE_ID, ADMIN_ROLE_ID, TICKETS_CATEGORY_ID, TICKETS_LOGS_CHANNEL_ID } = client.config;

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

          // Mostrar confirmación antes de crear el ticket
          const tipoInfo = TICKET_TYPES.find(t => t.id === tipo);
          const confirmEmbed = new EmbedBuilder()
            .setTitle('🎫 Confirmar Creación de Ticket')
            .setDescription(`¿Estás seguro de que quieres crear un ticket de **${tipoInfo?.label}**?`)
            .addFields(
              { name: '📋 Tipo', value: tipoInfo?.label || 'Desconocido', inline: true },
              { name: '📝 Descripción', value: tipoInfo?.description || 'Sin descripción', inline: true },
              { name: '⚠️ Importante', value: 'Crear tickets por error puede resultar en sanciones.\nAsegúrate de que realmente necesitas soporte.', inline: false }
            )
            .setColor('#ffaa00')
            .setFooter({ text: '• Tickets vK' })
            .setTimestamp();

          const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ticket_confirm_create_${tipo}`)
              .setLabel('✅ Confirmar')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('ticket_cancel_create')
              .setLabel('❌ Cancelar')
              .setStyle(ButtonStyle.Danger)
          );

          await interaction.reply({
            embeds: [confirmEmbed],
            components: [confirmRow],
            ephemeral: true
          });
        }
      );
    }

    if (interaction.customId.startsWith('ticket_confirm_create_')) {
      const tipo = interaction.customId.replace('ticket_confirm_create_', '');
      const userId = interaction.user.id;

      // Crear canal de ticket
      const ticketName = `ticket-${tipo}-${interaction.user.username}`
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "");

      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: ticketName,
          type: ChannelType.GuildText,
          parent: categoryId,
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
              id: staffRoleId,
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

        const tipoInfo = TICKET_TYPES.find(t => t.id === tipo);
        const welcomeEmbed = new EmbedBuilder()
          .setTitle("🎫 vK Tickets")
          .setDescription(`¡Hola <@${userId}>! Tu ticket ha sido creado exitosamente.`)
          .addFields(
            { name: '📋 Tipo de Ticket', value: tipoInfo?.label || 'Desconocido', inline: true },
            { name: '📝 Descripción', value: tipoInfo?.description || 'Sin descripción', inline: true },
            { name: '🕐 Fecha de Creación', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
            { name: '📢 Instrucciones', value: 'Un miembro del staff te atenderá pronto.\nPuedes proporcionar los detalles de tu problema o duda mientras esperas.', inline: false },
            { name: '⚡ Prioridad', value: 'Normal', inline: true },
            { name: '👤 Estado', value: 'Abierto', inline: true }
          )
          .setColor("#5865F2")
          .setFooter({ text: `ID: ${ticketChannel.id} • vK Support` })
          .setImage('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnZjYnNmbTBpMXBmMDIwYjIwbWdzcnVtY2p2MjEwODV2YWl5MXk1MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/7NeoMpmd7Ie9l1cO5c/giphy.gif')
          .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Reclamar")
            .setStyle(ButtonStyle.Success)
            .setEmoji("👋"),
          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Cerrar")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒"),
          new ButtonBuilder()
            .setCustomId("ticket_priority")
            .setLabel("Prioridad")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⚡")
        );

        await ticketChannel.send({
          content: `<@${userId}> <@&${STAFF_ROLE_ID}>`,
          embeds: [welcomeEmbed],
          components: [actionRow],
        });

        await interaction.update({
          content: `✅ Ticket creado: ${ticketChannel}`,
          embeds: [],
          components: []
        });
      } catch (error) {
        console.error(error);
        await interaction.update({
          content: "❌ Error al crear el ticket.",
          embeds: [],
          components: []
        });
      }
    }

    if (interaction.customId === 'ticket_cancel_create') {
      await interaction.update({
        content: "❌ Creación de ticket cancelada.",
        embeds: [],
        components: []
      });
    }

    if (interaction.customId === 'ticket_close') {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({
          content: "❌ Este botón solo funciona en tickets.",
          ephemeral: true,
        });
      }

      const { STAFF_ROLE_ID, ADMIN_ROLE_ID } = client.config;
      
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Solo el staff puede cerrar tickets.",
          ephemeral: true,
        });
      }

      const reasonEmbed = new EmbedBuilder()
        .setTitle('🔒 Cerrar Ticket')
        .setDescription('Por favor, proporciona una razón para cerrar este ticket:')
        .setColor('#ffaa00');

      const reasonRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_close_reason')
          .setPlaceholder('Selecciona una razón...')
          .addOptions([
            { label: 'Problema resuelto', value: 'resuelto', emoji: '✅' },
            { label: 'Falta de respuesta del usuario', value: 'sin_respuesta', emoji: '⏰' },
            { label: 'Ticket duplicado', value: 'duplicado', emoji: '🔄' },
            { label: 'Información insuficiente', value: 'info_insuficiente', emoji: '❓' },
            { label: 'Derivado a otro departamento', value: 'derivado', emoji: '📨' },
            { label: 'Spam o ticket falso', value: 'spam', emoji: '🚫' },
            { label: 'Otra razón', value: 'otra', emoji: '📝' }
          ])
      );

      await interaction.reply({
        embeds: [reasonEmbed],
        components: [reasonRow],
        ephemeral: true,
      });
    }

    if (interaction.customId === 'ticket_close_reason') {
      const reason = interaction.values[0];
      const reasonLabels = {
        'resuelto': 'Problema resuelto',
        'sin_respuesta': 'Falta de respuesta del usuario',
        'duplicado': 'Ticket duplicado',
        'info_insuficiente': 'Información insuficiente',
        'derivado': 'Derivado a otro departamento',
        'spam': 'Spam o ticket falso',
        'otra': 'Otra razón'
      };

      await closeTicket(interaction.channel, interaction.user, reasonLabels[reason], ticketsDb, client);
      await interaction.update({
        content: `✅ Ticket cerrado por: **${reasonLabels[reason]}**`,
        embeds: [],
        components: [],
      });
    }

    if (interaction.customId === 'ticket_claim') {
      const { STAFF_ROLE_ID, ADMIN_ROLE_ID } = client.config;
      
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Solo el staff puede reclamar tickets.",
          ephemeral: true,
        });
      }

      ticketsDb.run(
        `UPDATE tickets SET assigned_to = ? WHERE channel_id = ?`,
        [interaction.user.id, interaction.channel.id],
        async (err) => {
          if (err) {
            return interaction.reply({
              content: "❌ Error al reclamar el ticket.",
              ephemeral: true,
            });
          }

          const claimEmbed = new EmbedBuilder()
            .setTitle("👋 Ticket Reclamado")
            .setDescription(`Este ticket ha sido reclamado por ${interaction.user}`)
            .addFields(
              { name: '👤 Staff Asignado', value: `${interaction.user.tag}`, inline: true },
              { name: '🕐 Fecha', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
            )
            .setColor("#00ff00")
            .setTimestamp();

          await interaction.reply({ embeds: [claimEmbed] });
        }
      );
    }

    if (interaction.customId === 'ticket_priority') {
      const { STAFF_ROLE_ID, ADMIN_ROLE_ID } = client.config;
      
      if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && !interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Solo el staff puede cambiar la prioridad.",
          ephemeral: true,
        });
      }

      const priorityRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_priority_low")
          .setLabel("Baja")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🟢"),
        new ButtonBuilder()
          .setCustomId("ticket_priority_normal")
          .setLabel("Normal")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🔵"),
        new ButtonBuilder()
          .setCustomId("ticket_priority_high")
          .setLabel("Alta")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔴")
      );

      await interaction.reply({
        content: "⚡ Selecciona la nueva prioridad:",
        components: [priorityRow],
        ephemeral: true,
      });
    }

    if (interaction.customId.startsWith('ticket_priority_')) {
      const priority = interaction.customId.replace('ticket_priority_', '');
      const priorityLabels = {
        'low': '🟢 Baja',
        'normal': '🔵 Normal', 
        'high': '🔴 Alta'
      };

      ticketsDb.run(
        `UPDATE tickets SET priority = ? WHERE channel_id = ?`,
        [priority, interaction.channel.id],
        async (err) => {
          if (err) {
            return interaction.update({
              content: "❌ Error al cambiar la prioridad.",
              components: [],
            });
          }

          const priorityEmbed = new EmbedBuilder()
            .setTitle("⚡ Prioridad Actualizada")
            .setDescription(`La prioridad del ticket ha sido cambiada a: **${priorityLabels[priority]}**`)
            .setColor(priority === 'high' ? '#e74c3c' : priority === 'normal' ? '#3498db' : '#2ecc71')
            .setTimestamp();

          await interaction.update({
            content: "",
            embeds: [priorityEmbed],
            components: [],
          });
        }
      );
    }

    // Handler para el menú de compra rápida
    if (interaction.customId === 'quick_buy_select') {
      const itemId = interaction.values[0].replace('buy_', '');
      const { economyDb } = client.config;

      economyDb.get('SELECT * FROM shop_items WHERE id = ?', [itemId], async (err, item) => {
        if (err || !item) {
          return interaction.reply({
            content: '❌ Error al encontrar el artículo.',
            ephemeral: true
          });
        }

        // Importar y usar la función handleBuy del comando buy
        const buyCommand = require('../commands/economy/buy.js');
        await buyCommand.handleBuy(interaction, interaction.user, item.name, client);
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

        ticketsDb.run(
          `UPDATE tickets SET status = 'cerrado', closed_at = ? WHERE channel_id = ?`,
          [new Date().toISOString(), channel.id]
        );

        //  enviar notificación al usuario 
        try {
          const ticketUser = client.users.cache.get(row.user_id);
          if (ticketUser) {
            const dmEmbed = new EmbedBuilder()
              .setTitle("🔒 Tu ticket ha sido cerrado")
              .setDescription(`Tu ticket en **${channel.guild.name}** ha sido cerrado.`)
              .addFields(
                { name: '🎫 Tipo', value: row.type || 'General', inline: true },
                { name: '👤 Cerrado por', value: user.tag, inline: true },
                { name: '📅 Fecha de cierre', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false },
                { name: '💬 Razón', value: reason || 'No especificada', inline: false }
              )
              .setColor('#e74c3c')
              .setFooter({ text: 'Gracias por contactar con vK Support' })
              .setTimestamp();

            await ticketUser.send({ embeds: [dmEmbed] });
          }
        } catch (dmError) {
          console.log('No se pudo enviar DM al usuario del ticket');
        }

        // Enviar transcripción completa logs del staff
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages
          .filter(m => !m.author.bot || m.embeds.length === 0)
          .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .map(msg => {
            const timestamp = new Date(msg.createdTimestamp).toLocaleString();
            const content = msg.content || "[Archivo adjunto o embed]";
            return `[${timestamp}] ${msg.author.tag}: ${content}`;
          })
          .join("\n");

        const buffer = Buffer.from(transcript, "utf-8");
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

        const logsChannel = channel.guild.channels.cache.get(client.config.TICKETS_LOGS_CHANNEL_ID);
        if (logsChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🔒 Ticket Cerrado")
            .setDescription("Detalles del ticket cerrado")
            .addFields(
              { name: '🎫 Canal', value: channel.name, inline: true },
              { name: '👤 Usuario', value: `<@${row.user_id}>`, inline: true },
              { name: '🗂️ Tipo', value: row.type || 'General', inline: true },
              { name: '👮 Cerrado por', value: user.toString(), inline: true },
              { name: '⚡ Prioridad', value: row.priority || 'normal', inline: true },
              { name: '🕐 Duración', value: row.created_at ? `<t:${Math.floor(new Date(row.created_at).getTime()/1000)}:R>` : 'Desconocida', inline: true },
              { name: '💬 Razón', value: reason || 'No especificada', inline: false }
            )
            .setColor("#e74c3c")
            .setTimestamp();

          await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
        }

        const closeEmbed = new EmbedBuilder()
          .setTitle('🔒 Ticket Cerrado')
          .setDescription(`Este ticket ha sido cerrado por ${user}`)
          .addFields(
            { name: '⏰ Eliminación', value: 'El canal se eliminará en 10 segundos', inline: true },
            { name: '📋 Logs', value: 'Transcripción enviada al equipo de staff', inline: true }
          )
          .setColor('#e74c3c')
          .setTimestamp();

        await channel.send({ embeds: [closeEmbed] });
        setTimeout(() => channel.delete().catch(console.error), 10000);
      }
    );
  } catch (error) {
    console.error(error);
  }
}

