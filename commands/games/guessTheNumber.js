const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess')
    .setDescription('Adivina el número secreto (1 al 100)'),

  async execute(interaction) {
    const number = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;

    await interaction.reply('🎯 ¡Adivina el número secreto entre 1 y 100! Tienes 10 intentos. Escribe tu número aquí:');

    const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 10 });

    collector.on('collect', async m => {
      attempts++;
      const guess = parseInt(m.content);

      if (guess === number) {
        await interaction.followUp(`🎉 ¡Correcto! El número era ${number}. Lo lograste en ${attempts} intento(s).`);
        collector.stop();
      } else if (attempts >= 10) {
        await interaction.followUp(`❌ Te quedaste sin intentos. El número era ${number}.`);
        collector.stop();
      } else if (guess < number) {
        await interaction.followUp('🔼 Muy bajo. Intenta con un número más alto.');
      } else {
        await interaction.followUp('🔽 Muy alto. Intenta con un número más bajo.');
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp('⌛ No enviaste ningún número. Fin del juego.');
      }
    });
  }
};
