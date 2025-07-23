const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../data/economy.db'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Juega Piedra, Papel o Tijera contra la bot.')
    .addStringOption(option =>
      option.setName('elección')
        .setDescription('Tu elección: piedra, papel o tijera')
        .setRequired(true)
        .addChoices(
          { name: '🪨 Piedra', value: 'piedra' },
          { name: '📄 Papel', value: 'papel' },
          { name: '✂️ Tijera', value: 'tijera' }
        )
    ),
  async execute(interaction) {
    const userChoice = interaction.options.getString('elección');
    const botChoices = ['piedra', 'papel', 'tijera'];
    const botChoice = botChoices[Math.floor(Math.random() * 3)];
    const userId = interaction.user.id;
    const username = interaction.user.username;

    const resultMatrix = {
      piedra: { piedra: 'Empate', papel: 'Perdiste', tijera: 'Ganaste' },
      papel: { piedra: 'Ganaste', papel: 'Empate', tijera: 'Perdiste' },
      tijera: { piedra: 'Perdiste', papel: 'Ganaste', tijera: 'Empate' }
    };

    const result = resultMatrix[userChoice][botChoice];

    const reward = {
      Ganaste: 100,
      Empate: 25,
      Perdiste: 0
    }[result];

    db.run(`INSERT OR IGNORE INTO users (user_id, username, balance, rps_wins, rps_streak) VALUES (?, ?, 0, 0, 0)`, [userId, username]);

    db.get(`SELECT * FROM users WHERE user_id = ?`, [userId], (err, row) => {
      if (err) return console.error(err);

      let newStreak = row.rps_streak || 0;
      let newWins = row.rps_wins || 0;

      if (result === 'Ganaste') {
        newStreak += 1;
        newWins += 1;
      } else {
        newStreak = 0;
      }

      db.run(`UPDATE users SET balance = balance + ?, rps_wins = ?, rps_streak = ? WHERE user_id = ?`, [
        reward,
        newWins,
        newStreak,
        userId
      ]);

      interaction.reply({
        embeds: [{
          title: `🕹️ Piedra, Papel o Tijera`,
          description: `**${username}** eligió **${userChoice}**\n**Bot** eligió **${botChoice}**\n\n🎯 Resultado: **${result}**\n💰 Recompensa: **${reward} coins**\n🔥 Racha actual: **${newStreak}** victorias`,
          color: result === 'Ganaste' ? 0x00ff00 : result === 'Perdiste' ? 0xff0000 : 0xffff00
        }]
      });
    });
  }
};
