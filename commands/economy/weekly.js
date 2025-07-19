
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('📅 Reclama tu recompensa semanal'),

  async execute(interaction, client) {
    const userId = interaction.user.id;

    client.config.economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error(err);
          return interaction.reply({
            content: '❌ Error al acceder a la base de datos.',
            ephemeral: true
          });
        }

        const now = new Date();
        const lastWeekly = row ? new Date(row.last_weekly) : null;

        // Verificar si han pasado 7 días
        if (lastWeekly && (now - lastWeekly) < 7 * 24 * 60 * 60 * 1000) {
          const timeLeft = 7 * 24 * 60 * 60 * 1000 - (now - lastWeekly);
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

          const embed = new EmbedBuilder()
            .setTitle('⏰ Recompensa Semanal')
            .setDescription(`Ya reclamaste tu recompensa semanal.\nPodrás reclamar la siguiente en **${hoursLeft}h ${minutesLeft}m**`)
            .setColor('#ff4444')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        // Calcular recompensa (entre 5000 y 15000)
        const baseReward = Math.floor(Math.random() * 10001) + 5000;
        const bonus = Math.floor(Math.random() * 5001); // Bonus aleatorio
        const totalReward = baseReward + bonus;

        if (row) {
          // Actualizar usuario existente
          client.config.economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_weekly = ? WHERE user_id = ?`,
            [totalReward, now.toISOString(), userId],
            function(err) {
              if (err) console.error(err);
            }
          );
        } else {
          // Crear nuevo usuario
          client.config.economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_weekly) VALUES (?, ?, ?)`,
            [userId, totalReward, now.toISOString()],
            function(err) {
              if (err) console.error(err);
            }
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('📅 Recompensa Semanal Reclamada')
          .setDescription(`¡Has recibido tu recompensa semanal!`)
          .addFields(
            { name: '💰 Recompensa Base', value: `**${baseReward.toLocaleString()}** monedas`, inline: true },
            { name: '🎁 Bonus', value: `**${bonus.toLocaleString()}** monedas`, inline: true },
            { name: '🏆 Total Recibido', value: `**${totalReward.toLocaleString()}** monedas`, inline: false }
          )
          .setColor('#00ff88')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Vuelve en 7 días para tu siguiente recompensa' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    );
  },

  name: 'weekly',
  async run(message, args, client) {
    const userId = message.author.id;

    client.config.economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error(err);
          return message.reply('❌ Error al acceder a la base de datos.');
        }

        const now = new Date();
        const lastWeekly = row ? new Date(row.last_weekly) : null;

        if (lastWeekly && (now - lastWeekly) < 7 * 24 * 60 * 60 * 1000) {
          const timeLeft = 7 * 24 * 60 * 60 * 1000 - (now - lastWeekly);
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

          const embed = new EmbedBuilder()
            .setTitle('⏰ Recompensa Semanal')
            .setDescription(`Ya reclamaste tu recompensa semanal.\nPodrás reclamar la siguiente en **${hoursLeft}h ${minutesLeft}m**`)
            .setColor('#ff4444')
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();

          return message.reply({ embeds: [embed] });
        }

        const baseReward = Math.floor(Math.random() * 10001) + 5000;
        const bonus = Math.floor(Math.random() * 5001);
        const totalReward = baseReward + bonus;

        if (row) {
          client.config.economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_weekly = ? WHERE user_id = ?`,
            [totalReward, now.toISOString(), userId]
          );
        } else {
          client.config.economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_weekly) VALUES (?, ?, ?)`,
            [userId, totalReward, now.toISOString()]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('📅 Recompensa Semanal Reclamada')
          .setDescription(`¡Has recibido tu recompensa semanal!`)
          .addFields(
            { name: '💰 Recompensa Base', value: `**${baseReward.toLocaleString()}** monedas`, inline: true },
            { name: '🎁 Bonus', value: `**${bonus.toLocaleString()}** monedas`, inline: true },
            { name: '🏆 Total Recibido', value: `**${totalReward.toLocaleString()}** monedas`, inline: false }
          )
          .setColor('#00ff88')
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: 'Vuelve en 7 días para tu siguiente recompensa' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    );
  }
};
