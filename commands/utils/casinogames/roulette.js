const { EmbedBuilder } = require('discord.js');

module.exports = {
  roulette: async (interaction, db, user, apuesta) => {
    const colors = ['🔴 Rojo', '⚫ Negro', '🟢 Verde'];
    const probabilities = [0.47, 0.47, 0.06];
    const payout = {
      '🔴 Rojo': 2,
      '⚫ Negro': 2,
      '🟢 Verde': 14
    };

    const resultado = weightedRandom(colors, probabilities);
    const apuestaColor = colors[Math.floor(Math.random() * colors.length)]; // O puedes pedir que el user elija color con una opción extra

    let ganancia = 0;
    let resultadoTexto = `🎯 La ruleta giró y cayó en **${resultado}**.`;

    if (apuestaColor === resultado) {
      ganancia = apuesta * payout[resultado];
      db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(ganancia, user.user_id);
      resultadoTexto += `\n✅ ¡Ganaste ${ganancia} vk coins apostando al ${apuestaColor}!`;
    } else {
      db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ?').run(apuesta, user.user_id);
      resultadoTexto += `\n❌ Perdiste ${apuesta} vk coins apostando al ${apuestaColor}.`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎯 Ruleta')
      .setDescription(resultadoTexto)
      .setColor('Random')
      .setFooter({ text: `Apuesta: ${apuesta} vk coins | Color elegido: ${apuestaColor}` });

    await interaction.reply({ embeds: [embed] });
  },

  slots: async (interaction, db, user, apuesta) => {
  },

  blackjack: async (interaction, db, user, apuesta, oponente) => {
  },

  dice: async (interaction, db, user, apuesta) => {
  },

  coinflip: async (interaction, db, user, apuesta) => {
  },

  crash: async (interaction, db, user, apuesta) => {
  },

  lottery: async (interaction, db, user, apuesta) => {
  },

  jackpot: async (interaction, db, user, apuesta) => {
  },

  luckywheel: async (interaction, db, user, apuesta) => {
  },

  poker: async (interaction, db, user, apuesta, oponente) => {
  }
};

function weightedRandom(items, weights) {
  const random = Math.random();
  let sum = 0;

  for (let i = 0; i < items.length; i++) {
    sum += weights[i];
    if (random <= sum) return items[i];
  }

  return items[items.length - 1];
}
