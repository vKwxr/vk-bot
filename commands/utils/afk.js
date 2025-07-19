
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('😴 Establece tu estado AFK')
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón por la cual estarás AFK')
        .setRequired(false)),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const razon = interaction.options.getString('razon') || 'Sin razón especificada';

    // Verificar si ya está AFK
    client.config.db.get(
      `SELECT * FROM afk_users WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row) {
          // Remover AFK
          client.config.db.run(
            `DELETE FROM afk_users WHERE user_id = ?`,
            [userId],
            async (err) => {
              if (err) {
                return interaction.reply({
                  content: '❌ Error al remover el estado AFK.',
                  ephemeral: true
                });
              }

              const embed = new EmbedBuilder()
                .setTitle('👋 Bienvenido de vuelta!')
                .setDescription(`${interaction.user}, ya no estás AFK`)
                .setColor('#00ff00')
                .setTimestamp();

              await interaction.reply({ embeds: [embed] });
            }
          );
        } else {
          // Establecer AFK
          client.config.db.run(
            `INSERT INTO afk_users (user_id, reason, timestamp) VALUES (?, ?, ?)`,
            [userId, razon, new Date().toISOString()],
            async (err) => {
              if (err) {
                return interaction.reply({
                  content: '❌ Error al establecer el estado AFK.',
                  ephemeral: true
                });
              }

              const embed = new EmbedBuilder()
                .setTitle('😴 Estado AFK Establecido')
                .setDescription(`${interaction.user} ahora está AFK`)
                .addFields(
                  { name: '💭 Razón', value: razon, inline: false },
                  { name: '🕐 Desde', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
                )
                .setColor('#ffaa00')
                .setTimestamp();

              await interaction.reply({ embeds: [embed] });
            }
          );
        }
      }
    );
  },

  name: 'afk',
  async run(message, args, client) {
    const userId = message.author.id;
    const razon = args.join(' ') || 'Sin razón especificada';

    client.config.db.get(
      `SELECT * FROM afk_users WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row) {
          // Remover AFK
          client.config.db.run(
            `DELETE FROM afk_users WHERE user_id = ?`,
            [userId]
          );

          const embed = new EmbedBuilder()
            .setTitle('👋 Bienvenido de vuelta!')
            .setDescription(`${message.author}, ya no estás AFK`)
            .setColor('#00ff00')
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        } else {
          // Establecer AFK
          client.config.db.run(
            `INSERT INTO afk_users (user_id, reason, timestamp) VALUES (?, ?, ?)`,
            [userId, razon, new Date().toISOString()]
          );

          const embed = new EmbedBuilder()
            .setTitle('😴 Estado AFK Establecido')
            .setDescription(`${message.author} ahora está AFK`)
            .addFields(
              { name: '💭 Razón', value: razon, inline: false },
              { name: '🕐 Desde', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
            )
            .setColor('#ffaa00')
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        }
      }
    );
  }
};
