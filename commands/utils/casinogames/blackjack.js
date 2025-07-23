// utils/casinoGames.js
module.exports = {
  slots: async (interaction, db, user, apuesta) => {
    // ... código slots aquí
  },

  blackjack: async (interaction, db, user, apuesta) => {
    const cartas = ['🂡', '🂢', '🂣', '🂤', '🂥', '🂦', '🂧', '🂨', '🂩', '🂪', '🂫', '🂭', '🂮'];
    const valores = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];

    const baraja = () => {
      let mazo = [];
      for (let i = 0; i < cartas.length; i++) {
        for (let j = 0; j < 4; j++) {
          mazo.push({ carta: cartas[i], valor: valores[i] });
        }
      }
      return mazo.sort(() => Math.random() - 0.5);
    };

    const mazo = baraja();
    let manoJugador = [];
    let manoBot = [];

    const robar = (mano) => {
      const carta = mazo.pop();
      mano.push(carta);
    };

    const calcularTotal = (mano) => {
      let total = mano.reduce((acc, c) => acc + c.valor, 0);
      let ases = mano.filter(c => c.valor === 11).length;
      while (total > 21 && ases > 0) {
        total -= 10;
        ases--;
      }
      return total;
    };

    // Robar 2 cartas iniciales
    robar(manoJugador); robar(manoJugador);
    robar(manoBot); robar(manoBot);

    const botones = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hit').setLabel('Pedir').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stand').setLabel('Plantarse').setStyle(ButtonStyle.Danger)
    );

    const mostrarMano = (mano) => mano.map(c => c.carta).join(' ');

    const embed = new EmbedBuilder()
      .setTitle('🃏 Blackjack')
      .setDescription(`Tu mano: ${mostrarMano(manoJugador)}\nTotal: ${calcularTotal(manoJugador)}\n\nCarta del bot: ${manoBot[0].carta}`)
      .setColor('Green');

    const msg = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'No toques lo que no es tuyo 🤨', ephemeral: true });

      if (i.customId === 'hit') {
        robar(manoJugador);
        const total = calcularTotal(manoJugador);

        if (total > 21) {
          collector.stop('bust');
        } else {
          const newEmbed = EmbedBuilder.from(embed)
            .setDescription(`Tu mano: ${mostrarMano(manoJugador)}\nTotal: ${total}\n\nCarta del bot: ${manoBot[0].carta}`);
          await i.update({ embeds: [newEmbed] });
        }
      }

      if (i.customId === 'stand') {
        collector.stop('stand');
      }
    });

    collector.on('end', async (_, reason) => {
      let resultado = '';
      const totalJugador = calcularTotal(manoJugador);

      if (reason === 'bust') {
        resultado = `💥 ¡Te pasaste con ${totalJugador}! Has perdido ${apuesta} vk coins.`;
        db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ?').run(apuesta, user.user_id);
      } else {
        while (calcularTotal(manoBot) < 17) robar(manoBot);

        const totalBot = calcularTotal(manoBot);
        if (totalBot > 21 || totalJugador > totalBot) {
          resultado = `🎉 ¡Ganaste! ${totalJugador} vs ${totalBot}. Has ganado ${apuesta * 2} vk coins.`;
          db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(apuesta, user.user_id);
        } else if (totalJugador === totalBot) {
          resultado = `🤝 Empate con ${totalJugador}. Te devolvemos tu apuesta.`;
        } else {
          resultado = `💀 Perdiste. ${totalJugador} vs ${totalBot}. Has perdido ${apuesta} vk coins.`;
          db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ?').run(apuesta, user.user_id);
        }
      }

      const finalEmbed = new EmbedBuilder()
        .setTitle('🃏 Blackjack - Resultado')
        .setColor('Red')
        .setDescription(`Tu mano: ${mostrarMano(manoJugador)} (${calcularTotal(manoJugador)})\nMano del bot: ${mostrarMano(manoBot)} (${calcularTotal(manoBot)})\n\n${resultado}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [finalEmbed], components: [] });
    });
  }
};
