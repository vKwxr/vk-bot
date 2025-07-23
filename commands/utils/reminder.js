
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms'); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('⏰ Crea un recordatorio')
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Tiempo del recordatorio (ej: 1h, 30m, 2d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('Mensaje del recordatorio')
        .setRequired(true)),

  async execute(interaction, client) {
    const tiempoStr = interaction.options.getString('tiempo');
    const mensaje = interaction.options.getString('mensaje');

    let tiempoMs;
    try {
      tiempoMs = ms(tiempoStr);
    } catch (error) {
      return interaction.reply({
        content: '❌ Formato de tiempo inválido. Usa formatos como: 1h, 30m, 2d, 1w',
        ephemeral: true
      });
    }

    if (!tiempoMs || tiempoMs < 60000 || tiempoMs > 2592000000) { // Min 1 minuto, Max 30 días
      return interaction.reply({
        content: '❌ El tiempo debe estar entre 1 minuto y 30 días.',
        ephemeral: true
      });
    }

    const tiempoRecordatorio = Date.now() + tiempoMs;
    const fechaRecordatorio = new Date(tiempoRecordatorio);

    client.config.db.run(
      `INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at) VALUES (?, ?, ?, ?, ?)`,
      [
        interaction.user.id,
        interaction.channel.id,
        mensaje,
        tiempoRecordatorio,
        Date.now()
      ],
      function(err) {
        if (err) {
          return interaction.reply({
            content: '❌ Error al crear el recordatorio.',
            ephemeral: true
          });
        }

        setTimeout(async () => {
          try {
            const channel = client.channels.cache.get(interaction.channel.id);
            if (channel) {
              const embed = new EmbedBuilder()
                .setTitle('⏰ Recordatorio')
                .setDescription(mensaje)
                .addFields(
                  { name: '👤 Para', value: `<@${interaction.user.id}>`, inline: true },
                  { name: '📅 Programado', value: `<t:${Math.floor(Date.now()/1000-tiempoMs/1000)}:R>`, inline: true }
                )
                .setColor('#ffaa00')
                .setTimestamp();

              await channel.send({ 
                content: `<@${interaction.user.id}>`, 
                embeds: [embed] 
              });

              client.config.db.run(
                `DELETE FROM reminders WHERE id = ?`,
                [this.lastID]
              );
            }
          } catch (error) {
            console.error('Error enviando recordatorio:', error);
          }
        }, tiempoMs);
      }
    );

    const embed = new EmbedBuilder()
      .setTitle('⏰ Recordatorio Creado')
      .setDescription(`Te recordaré: **${mensaje}**`)
      .addFields(
        { name: '📅 Fecha', value: `<t:${Math.floor(tiempoRecordatorio/1000)}:F>`, inline: true },
        { name: '⏱️ En', value: `<t:${Math.floor(tiempoRecordatorio/1000)}:R>`, inline: true }
      )
      .setColor('#00ff00')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'reminder',
  async run(message, args, client) {
    if (args.length < 2) {
      return message.reply('❌ Uso: `vkreminder <tiempo> <mensaje>`\nEjemplo: `vkreminder 1h Reunión importante`');
    }

    const tiempoStr = args[0];
    const mensaje = args.slice(1).join(' ');

    let tiempoMs;
    try {
      tiempoMs = ms(tiempoStr);
    } catch (error) {
      return message.reply('❌ Formato de tiempo inválido. Usa formatos como: 1h, 30m, 2d, 1w');
    }

    if (!tiempoMs || tiempoMs < 60000 || tiempoMs > 2592000000) {
      return message.reply('❌ El tiempo debe estar entre 1 minuto y 30 días.');
    }

    const tiempoRecordatorio = Date.now() + tiempoMs;

    client.config.db.run(
      `INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at) VALUES (?, ?, ?, ?, ?)`,
      [
        message.author.id,
        message.channel.id,
        mensaje,
        tiempoRecordatorio,
        Date.now()
      ],
      function(err) {
        if (err) {
          return message.reply('❌ Error al crear el recordatorio.');
        }

        setTimeout(async () => {
          try {
            const embed = new EmbedBuilder()
              .setTitle('⏰ Recordatorio')
              .setDescription(mensaje)
              .setColor('#ffaa00')
              .setTimestamp();

            await message.channel.send({ 
              content: `<@${message.author.id}>`, 
              embeds: [embed] 
            });

            client.config.db.run(
              `DELETE FROM reminders WHERE id = ?`,
              [this.lastID]
            );
          } catch (error) {
            console.error('Error enviando recordatorio:', error);
          }
        }, tiempoMs);
      }
    );

    const embed = new EmbedBuilder()
      .setTitle('⏰ Recordatorio Creado')
      .setDescription(`Te recordaré: **${mensaje}**`)
      .setColor('#00ff00')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
