const path = require("path");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, "../../economy.db"));

const riddles = [
  {
    question: 'Tengo agujas pero no pincho. ¿Qué soy?',
    answer: 'reloj',
    hint: 'Mide el tiempo.'
  },
  {
    question: 'Cuanto más seco, más pesa. ¿Qué es?',
    answer: 'agua',
    hint: 'Elemento natural.'
  },
  {
    question: 'Entre más me quitas, más grande soy. ¿Qué soy?',
    answer: 'agujero',
    hint: 'Vacío.'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mindmaze')
    .setDescription('🧠 Juega el laberinto mental de acertijos extremos'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Apuesta
    const bet = 50;
    db.get(`SELECT balance FROM users WHERE user_id = ?`, [userId], async (err, row) => {
      if (err || !row) {
        return interaction.reply({ content: '❌ Error al acceder a tu balance.', ephemeral: true });
      }

      if (row.balance < bet) {
        return interaction.reply({ content: `💸 Necesitas al menos ${bet} monedas para jugar.`, ephemeral: true });
      }

      // Reto
      const riddle = riddles[Math.floor(Math.random() * riddles.length)];
      const embed = new EmbedBuilder()
        .setTitle('🧠 MindMaze')
        .setDescription(`Acertijo:\n**${riddle.question}**\n\nTienes 15 segundos para responder escribiendo la respuesta.`)
        .setColor('#8b5cf6');

      await interaction.reply({ embeds: [embed] });

      const filter = m => m.author.id === userId;
      const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

      let answered = false;

      collector.on('collect', async msg => {
        if (msg.content.toLowerCase().includes(riddle.answer)) {
          answered = true;
          collector.stop();

          const reward = 100;
          db.run(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [reward, userId]);

          const winEmbed = new EmbedBuilder()
            .setTitle('🎉 ¡Correcto!')
            .setDescription(`Has ganado 💰 **${reward} monedas**.\n¡Tu mente es afilada como una katana!`)
            .setColor('#00ff88');

          await interaction.followUp({ embeds: [winEmbed] });
        } else {
          msg.react('❌');
        }
      });

      collector.on('end', async collected => {
        if (!answered) {
          db.run(`UPDATE users SET balance = balance - ? WHERE user_id = ?`, [bet, userId]);

          const loseEmbed = new EmbedBuilder()
            .setTitle('💀 Fallaste el acertijo...')
            .setDescription(`La respuesta era: **${riddle.answer}**\nPerdiste 💸 **${bet} monedas**.`)
            .setColor('#ff5555');

          await interaction.followUp({ embeds: [loseEmbed] });
        }
      });
    });
  }
};