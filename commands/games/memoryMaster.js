const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js'); // Asegúrate de tener tu DB conectada

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memory')
    .setDescription('🧠 Memory Master: ¡Memoriza y gana recompensas!')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('💰 Apuesta para este juego')
        .setMinValue(0)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet') || 0;

    // Verificamos saldo
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!user || user.balance < bet) {
      return interaction.reply({ content: '❌ No tienes suficiente saldo para esa apuesta.', ephemeral: true });
    }

    // Descontar apuesta temporal
    if (bet > 0) {
      await db.run('UPDATE users SET balance = balance - ? WHERE user_id = ?', [bet, userId]);
    }

    // Generar patrón
    const emojis = ['🍎','🍌','🍇','🍒','🍍','🥝','🥑','🍉'];
    const sequence = Array.from({ length: 5 }, () => emojis[Math.floor(Math.random() * emojis.length)]);

    await interaction.reply(`🧠 Memoriza esta secuencia:`);

    const msg = await interaction.followUp({ content: `\`${sequence.join(' ')}\``, ephemeral: true });
    
    // Esperar y luego borrar mensaje
    setTimeout(async () => {
      await msg.delete();
      
      // Crear botones
      const row = new ActionRowBuilder();
      const buttons = emojis.map(emoji =>
        new ButtonBuilder().setCustomId(`guess_${emoji}`).setLabel(emoji).setStyle(ButtonStyle.Primary)
      );
      row.addComponents(buttons);

      let guess = [];

      const gameMsg = await interaction.followUp({
        content: `🔁 ¡Ahora repite la secuencia correctamente!`,
        components: [row],
        fetchReply: true
      });

      const collector = gameMsg.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        time: 30000
      });

      collector.on('collect', async i => {
        guess.push(i.customId.replace('guess_', ''));
        await i.deferUpdate();

        if (guess.length === sequence.length) {
          collector.stop();
          const win = sequence.every((v, i) => v === guess[i]);

          if (win) {
            const reward = bet > 0 ? bet * 2 : 500;
            await db.run('UPDATE users SET balance = balance + ?, streak = streak + 1 WHERE user_id = ?', [reward, userId]);
            await interaction.followUp(`✅ ¡Correcto! Ganaste ${reward} monedas.\n🎯 Secuencia: \`${sequence.join(' ')}\``);
          } else {
            await db.run('UPDATE users SET streak = 0 WHERE user_id = ?', [userId]);
            await interaction.followUp(`❌ Fallaste. La secuencia era: \`${sequence.join(' ')}\``);
          }

          await gameMsg.edit({ components: [] });
        }
      });

      collector.on('end', async collected => {
        if (guess.length < sequence.length) {
          await db.run('UPDATE users SET streak = 0 WHERE user_id = ?', [userId]);
          await interaction.followUp('⌛ Se acabó el tiempo. Juego finalizado.');
          await gameMsg.edit({ components: [] });
        }
      });

    }, 5000);
  }
};

