const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

function generateProblem(difficulty) {
  const operators = ['+', '-', '*'];
  let num1, num2, op;

  switch (difficulty) {
    case 'easy':
      num1 = Math.floor(Math.random() * 10);
      num2 = Math.floor(Math.random() * 10);
      break;
    case 'medium':
      num1 = Math.floor(Math.random() * 50);
      num2 = Math.floor(Math.random() * 50);
      break;
    case 'hard':
      num1 = Math.floor(Math.random() * 100);
      num2 = Math.floor(Math.random() * 100);
      break;
  }

  op = operators[Math.floor(Math.random() * operators.length)];
  const question = `${num1} ${op} ${num2}`;
  const answer = eval(question);

  return { question, answer };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mathbattle')
    .setDescription('Resuelve un problema matemático antes de que se acabe el tiempo')
    .addStringOption(option =>
      option.setName('difficulty')
        .setDescription('Selecciona la dificultad')
        .setRequired(true)
        .addChoices(
          { name: 'Easy 🟢', value: 'easy' },
          { name: 'Medium 🟡', value: 'medium' },
          { name: 'Hard 🔴', value: 'hard' }
        )
    ),

  async execute(interaction) {
    const difficulty = interaction.options.getString('difficulty');
    const { question, answer } = generateProblem(difficulty);

    await interaction.reply(`🧠 Resuelve esto (${difficulty.toUpperCase()}): **${question}**\n_Tienes 15 segundos_ ⏳`);

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

    collector.on('collect', m => {
      if (parseInt(m.content) === answer) {
        interaction.followUp(`✅ ¡Correcto! La respuesta era **${answer}**. Bien hecho, genio 🧠`);
        collector.stop();
      } else {
        interaction.followUp('❌ Incorrecto, sigue intentando...');
      }
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'user') {
        interaction.followUp(`⏰ Se acabó el tiempo. La respuesta correcta era **${answer}**.`);
      }
    });
  }
};
