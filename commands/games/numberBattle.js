const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./economy.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('numberbattle')
    .setDescription('Enfrenta al bot en una batalla de números.')
    .addStringOption(option =>
      option.setName('dificultad')
        .setDescription('Elige la dificultad')
        .setRequired(true)
        .addChoices(
          { name: 'Fácil', value: 'easy' },
          { name: 'Normal', value: 'normal' },
          { name: 'Difícil', value: 'hard' }
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const difficulty = interaction.options.getString('dificultad');

    const difficultySettings = {
      easy: { max: 10, reward: 50 },
      normal: { max: 20, reward: 100 },
      hard: { max: 50, reward: 200 },
    };

    const { max, reward } = difficultySettings[difficulty];
    const userNumber = Math.floor(Math.random() * max) + 1;
    const botNumber = Math.floor(Math.random() * max) + 1;

    let result = '';
    let extra = '';

    if (userNumber > botNumber) {
      result = `🎉 ¡Ganaste! Tu número: **${userNumber}** > Bot: **${botNumber}**\nHas ganado 💰 **${reward} coins**.`;
      db.run(`
        UPDATE economy
        SET money = money + ?,
            rps_wins = rps_wins + 1,
            rps_streak = rps_streak + 1
        WHERE userId = ?;
      `, [reward, userId]);

      db.get(`SELECT rps_streak FROM economy WHERE userId = ?`, [userId], (err, row) => {
        if (row && row.rps_streak % 5 === 0) {
          interaction.followUp(`🔥 ¡Racha de ${row.rps_streak} victorias seguidas!`);
        }
      });

    } else if (userNumber < botNumber) {
      result = `😢 Perdiste. Tu número: **${userNumber}** < Bot: **${botNumber}**`;
      db.run(`
        UPDATE economy
        SET rps_streak = 0
        WHERE userId = ?;
      `, [userId]);
    } else {
      result = `🤝 Empate. Ambos sacaron **${userNumber}**`;
    }

    interaction.reply({
      content: `⚔️ **Batalla de Números - Dificultad: ${difficulty.toUpperCase()}**\n\n${result}`,
      ephemeral: false
    });
  }
};
