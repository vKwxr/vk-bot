const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, "../../economy.db"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Juega Piedra, Papel o Tijera contra el bot.')
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
    const reward = { Ganaste: 100, Empate: 25, Perdiste: 0 }[result];

    // Crear usuario si no existe
    db.run(
      `INSERT OR IGNORE INTO users (user_id, username, balance, rps_wins, rps_streak) VALUES (?, ?, 0, 0, 0)`,
      [userId, username],
      (err) => {
        if (err) return console.error(err);

        // Obtener datos del usuario
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

          // Actualizar datos
          db.run(
            `UPDATE users SET balance = balance + ?, rps_wins = ?, rps_streak = ? WHERE user_id = ?`,
            [reward, newWins, newStreak, userId],
            (err) => {
              if (err) return console.error(err);

              // Enviar respuesta
              const embed = new EmbedBuilder()
                .setTitle('🕹️ Piedra, Papel o Tijera')
                .setDescription(
                  `**${username}** eligió **${userChoice}**\n` +
                  `**Bot** eligió **${botChoice}**\n\n` +
                  `🎯 Resultado: **${result}**\n` +
                  `💰 Recompensa: **${reward} coins**\n` +
                  `🔥 Racha actual: **${newStreak}** victorias`
                )
                .setColor(result === 'Ganaste' ? 0x00ff00 : result === 'Perdiste' ? 0xff0000 : 0xffff00);

              interaction.reply({ embeds: [embed] });
            }
          );
        });
      }
    );
  }
};
