const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('💵 Reclama tu recompensa diaria'),

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const userId = interaction.user.id;
    const today = new Date().toDateString();

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row && row.last_daily === today) {
          return interaction.reply({
            content: '❌ Ya has reclamado tu recompensa diaria hoy. Vuelve mañana.',
            ephemeral: true
          });
        }

        const amount = Math.floor(Math.random() * 61) + 40; 

        if (row) {
          economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_daily = ? WHERE user_id = ?`,
            [amount, today, userId]
          );
        } else {
          economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_daily) VALUES (?, ?, ?)`,
            [userId, amount, today]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('💵 Recompensa Diaria')
          .setDescription(`¡Has recibido **${amount.toLocaleString()} vK Coins**!`)
          .setColor('#00ff00')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    );
  },

  name: 'daily',
  async run(message, args, client) {
    const { economyDb } = client.config;
    const userId = message.author.id;
    const today = new Date().toDateString();

    economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (row && row.last_daily === today) {
          return message.reply('❌ Ya has reclamado tu recompensa diaria hoy. Vuelve mañana.');
        }

        const amount = Math.floor(Math.random() * 61) + 40; 

        if (row) {
          economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_daily = ? WHERE user_id = ?`,
            [amount, today, userId]
          );
        } else {
          economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_daily) VALUES (?, ?, ?)`,
            [userId, amount, today]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('💵 Recompensa Diaria')
          .setDescription(`¡Has recibido **${amount.toLocaleString()} vK Coins**!`)
          .setColor('#00ff00')
          .setThumbnail(message.author.displayAvatarURL())
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      }
    );
  }
};
