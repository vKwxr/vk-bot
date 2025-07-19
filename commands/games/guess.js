
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const activeGames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess')
    .setDescription('🎯 Juego de adivinar números')
    .addIntegerOption(option =>
      option.setName('rango')
        .setDescription('Rango máximo del número (1-rango)')
        .setRequired(false)
        .setMinValue(10)
        .setMaxValue(1000)),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const rango = interaction.options.getInteger('rango') || 100;

    if (activeGames.has(userId)) {
      return interaction.reply({
        content: '❌ Ya tienes un juego activo. Termínalo primero.',
        ephemeral: true
      });
    }

    const numeroSecreto = Math.floor(Math.random() * rango) + 1;
    const tiempoInicio = Date.now();

    activeGames.set(userId, {
      numeroSecreto,
      rango,
      intentos: 0,
      tiempoInicio,
      canal: interaction.channel.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🎯 Juego de Adivinanza')
      .setDescription(`¡He pensado en un número entre **1** y **${rango}**!`)
      .addFields(
        { name: '📝 Instrucciones', value: 'Escribe un número para adivinar\nTienes intentos ilimitados', inline: false },
        { name: '🏆 Premio', value: 'Ganarás monedas según la dificultad', inline: true }
      )
      .setColor('#ffaa00')
      .setFooter({ text: 'Escribe "rendirse" para terminar el juego' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Collector para escuchar respuestas
    const filter = m => m.author.id === userId && !m.author.bot;
    const collector = interaction.channel.createMessageCollector({ 
      filter, 
      time: 300000 // 5 minutos
    });

    collector.on('collect', async (message) => {
      const juego = activeGames.get(userId);
      if (!juego) return;

      const respuesta = message.content.toLowerCase().trim();

      if (respuesta === 'rendirse' || respuesta === 'quit') {
        activeGames.delete(userId);
        collector.stop();

        const embedRendirse = new EmbedBuilder()
          .setTitle('🏳️ Te has rendido')
          .setDescription(`El número era **${juego.numeroSecreto}**`)
          .setColor('#e74c3c');

        return message.reply({ embeds: [embedRendirse] });
      }

      const numero = parseInt(respuesta);
      if (isNaN(numero) || numero < 1 || numero > juego.rango) {
        return message.react('❌');
      }

      juego.intentos++;

      if (numero === juego.numeroSecreto) {
        // ¡Ganó!
        activeGames.delete(userId);
        collector.stop();

        const tiempoTotal = Math.floor((Date.now() - juego.tiempoInicio) / 1000);
        const puntosDificultad = Math.floor(juego.rango / 10);
        const puntosIntentos = Math.max(1, 10 - juego.intentos);
        const puntosRapidez = Math.max(1, 60 - tiempoTotal);
        const monedas = puntosDificultad + puntosIntentos + puntosRapidez;

        // Actualizar economía
        const { economyDb } = client.config;
        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [userId],
          (err, row) => {
            if (!row) {
              economyDb.run(
                `INSERT INTO economy (user_id, wallet) VALUES (?, ?)`,
                [userId, monedas]
              );
            } else {
              economyDb.run(
                `UPDATE economy SET wallet = wallet + ? WHERE user_id = ?`,
                [monedas, userId]
              );
            }
          }
        );

        const embedGano = new EmbedBuilder()
          .setTitle('🎉 ¡Correcto!')
          .setDescription(`¡Has adivinado el número **${juego.numeroSecreto}**!`)
          .addFields(
            { name: '🎯 Intentos', value: `${juego.intentos}`, inline: true },
            { name: '⏱️ Tiempo', value: `${tiempoTotal}s`, inline: true },
            { name: '💰 Ganaste', value: `${monedas} monedas`, inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp();

        return message.reply({ embeds: [embedGano] });

      } else {
        // Pista
        const pista = numero < juego.numeroSecreto ? 'más alto' : 'más bajo';
        const embed = new EmbedBuilder()
          .setTitle('🎯 Intenta de nuevo')
          .setDescription(`El número es **${pista}** que ${numero}`)
          .addFields(
            { name: '🔢 Intentos', value: `${juego.intentos}`, inline: true },
            { name: '📊 Rango', value: `1 - ${juego.rango}`, inline: true }
          )
          .setColor('#ffaa00');

        await message.reply({ embeds: [embed] });
      }
    });

    collector.on('end', () => {
      if (activeGames.has(userId)) {
        activeGames.delete(userId);
        interaction.followUp('⏰ El juego ha terminado por inactividad.');
      }
    });
  },

  name: 'guess',
  async run(message, args, client) {
    const userId = message.author.id;
    const rango = parseInt(args[0]) || 100;

    if (activeGames.has(userId)) {
      return message.reply('❌ Ya tienes un juego activo. Termínalo primero.');
    }

    const numeroSecreto = Math.floor(Math.random() * rango) + 1;
    const tiempoInicio = Date.now();

    activeGames.set(userId, {
      numeroSecreto,
      rango,
      intentos: 0,
      tiempoInicio,
      canal: message.channel.id
    });

    const embed = new EmbedBuilder()
      .setTitle('🎯 Juego de Adivinanza')
      .setDescription(`¡He pensado en un número entre **1** y **${rango}**!`)
      .addFields(
        { name: '📝 Instrucciones', value: 'Escribe un número para adivinar\nTienes intentos ilimitados', inline: false },
        { name: '🏆 Premio', value: 'Ganarás monedas según la dificultad', inline: true }
      )
      .setColor('#ffaa00')
      .setFooter({ text: 'Escribe "rendirse" para terminar el juego' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === userId && !m.author.bot;
    const collector = message.channel.createMessageCollector({ 
      filter, 
      time: 300000 
    });

    collector.on('collect', async (msg) => {
      const juego = activeGames.get(userId);
      if (!juego) return;

      const respuesta = msg.content.toLowerCase().trim();

      if (respuesta === 'rendirse') {
        activeGames.delete(userId);
        collector.stop();
        return msg.reply(`🏳️ Te has rendido. El número era **${juego.numeroSecreto}**`);
      }

      const numero = parseInt(respuesta);
      if (isNaN(numero)) return;

      juego.intentos++;

      if (numero === juego.numeroSecreto) {
        activeGames.delete(userId);
        collector.stop();

        const monedas = Math.floor(rango / 10) + Math.max(1, 10 - juego.intentos);

        const { economyDb } = client.config;
        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [userId],
          (err, row) => {
            if (!row) {
              economyDb.run(`INSERT INTO economy (user_id, wallet) VALUES (?, ?)`, [userId, monedas]);
            } else {
              economyDb.run(`UPDATE economy SET wallet = wallet + ? WHERE user_id = ?`, [monedas, userId]);
            }
          }
        );

        return msg.reply(`🎉 ¡Correcto! El número era **${juego.numeroSecreto}**. Ganaste **${monedas} monedas**`);
      } else {
        const pista = numero < juego.numeroSecreto ? 'más alto' : 'más bajo';
        await msg.reply(`🎯 El número es **${pista}** que ${numero}. Intentos: ${juego.intentos}`);
      }
    });
  }
};
