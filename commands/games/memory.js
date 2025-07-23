const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memory')
    .setDescription('Pon a prueba tu memoria visual con una secuencia'),

  async execute(interaction) {
    const emojis = ['🍎', '🍌', '🍇', '🍓', '🍍', '🥝', '🍉', '🥑'];
    const sequence = Array.from({ length: 5 }, () =>
      emojis[Math.floor(Math.random() * emojis.length)]
    );

    await interaction.reply({
      content: `🧠 **Memoriza esta secuencia:**\n\n${sequence.join(' ')}`,
      ephemeral: true
    });

    setTimeout(async () => {
      await interaction.editReply({
        content: `⌛ Ahora, dime la secuencia exacta. Escríbela como:\n\`/answer 🍎 🍌 🍇 🍓 🍍\``
      });

      interaction.client.memoryGame = interaction.client.memoryGame || {};
      interaction.client.memoryGame[interaction.user.id] = sequence.join(' ');
    }, 5000);
  }
};
