// 📁 Archivo: ultimateTrivia.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3')('./data/economy.db');
const triviaData = require('../../data/trivia/questions.json'); // JSON con preguntas categorizadas

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('🎲 Juega una trivia por niveles, apuestas y ranking')
    .addStringOption(opt =>
      opt.setName('modo')
        .setDescription('Elige el modo de juego')
        .addChoices(
          { name: '🎯 Solo', value: 'solo' },
          { name: '⚔️ PvP', value: 'pvp' },
          { name: '🤝 Cooperativo', value: 'coop' })
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('dificultad')
        .setDescription('Nivel de dificultad')
        .addChoices(
          { name: 'Fácil', value: 'facil' },
          { name: 'Normal', value: 'normal' },
          { name: 'Difícil', value: 'dificil' },
          { name: 'Insano', value: 'insano' })
        .setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('apuesta')
        .setDescription('💰 Monedas a apostar (solo en Solo y PvP)')
        .setRequired(false)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const modo = interaction.options.getString('modo');
    const dificultad = interaction.options.getString('dificultad');
    const apuesta = interaction.options.getInteger('apuesta') || 0;

    // 👤 Verifica si el jugador tiene cuenta
    const user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
    if (!user) return interaction.reply({ content: '❌ Necesitas una cuenta de economía. Usa /start', ephemeral: true });

    // 💸 Verifica la apuesta
    if (apuesta > 0 && user.coins < apuesta)
      return interaction.reply({ content: '❌ No tienes suficientes monedas para apostar eso.', ephemeral: true });

    // 🧠 Escoge preguntas por dificultad
    const preguntas = triviaData[dificultad];
    const question = preguntas[Math.floor(Math.random() * preguntas.length)];
    const correctAnswer = question.correct;
    const shuffled = [...question.incorrect, correctAnswer].sort(() => 0.5 - Math.random());

    // 📦 Botones con respuestas
    const buttons = new ActionRowBuilder().addComponents(
      shuffled.map((opt, i) => new ButtonBuilder()
        .setCustomId(`trivia_${opt === correctAnswer ? 'correct' : 'wrong'}_${i}`)
        .setLabel(opt)
        .setStyle(ButtonStyle.Primary))
    );

    // 🎨 Mensaje embed visual
    const embed = new EmbedBuilder()
      .setTitle(`❓ Trivia: ${question.category}`)
      .setDescription(`**${question.question}**`)
      .setColor('#FFA500')
      .setFooter({ text: `Dificultad: ${dificultad.toUpperCase()} | Tiempo: 15s` });

    await interaction.reply({ embeds: [embed], components: [buttons] });

    // ⏳ Espera respuesta
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15000
    });

    collector.on('collect', async i => {
      if (i.customId.includes('correct')) {
        let premio = getPremio(dificultad);
        db.prepare('UPDATE users SET coins = coins + ? WHERE userId = ?').run(premio, userId);
        i.update({ content: `🎉 ¡Correcto! Ganaste **${premio}** monedas.`, embeds: [], components: [] });
      } else {
        if (apuesta > 0) db.prepare('UPDATE users SET coins = coins - ? WHERE userId = ?').run(apuesta, userId);
        i.update({ content: `❌ Incorrecto. ${apuesta > 0 ? `Perdiste tu apuesta de ${apuesta} monedas.` : ''}`, embeds: [], components: [] });
      }
      collector.stop();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        interaction.editReply({ content: '⏱️ Tiempo agotado. ¡Intenta más rápido la próxima!', embeds: [], components: [] });
      }
    });
  }
};

function getPremio(dif) {
  const tabla = { facil: 25, normal: 50, dificil: 100, insano: 200 };
  return tabla[dif] || 10;
}
