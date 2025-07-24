const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const db = require('better-sqlite3')(path.join(__dirname, "./main.db"));
const games = require(path.join("..\\utils\\casinoGames"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('🎰 Accede a todos los juegos de casino')
    .addSubcommand(sub =>
      sub
        .setName('play')
        .setDescription('🎮 Juega un juego de casino')
        .addStringOption(opt =>
          opt.setName('juego')
            .setDescription('Elige el juego')
            .setRequired(true)
            .addChoices(
              { name: 'Slots 🎰', value: 'slots' },
              { name: 'Blackjack 🃏', value: 'blackjack' },
              { name: 'Dice 🎲', value: 'dice' },
              { name: 'Coinflip 🪙', value: 'coinflip' },
              { name: 'Roulette 🎯', value: 'roulette' },
              { name: 'Crash 💥', value: 'crash' },
              { name: 'Lottery 🎫', value: 'lottery' },
              { name: 'Jackpot 💰', value: 'jackpot' },
              { name: 'Lucky Wheel 🎡', value: 'luckywheel' },
              { name: 'Poker ♠️', value: 'poker' },
            )
        )
        .addIntegerOption(opt =>
          opt.setName('apuesta')
            .setDescription('Cantidad de vk coins a apostar')
            .setRequired(true)
        )
        .addUserOption(opt =>
          opt.setName('oponente')
            .setDescription('Jugador al que deseas retar (si aplica)')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('ranking')
        .setDescription('📈 Muestra el ranking global de casino')
    )
    .addSubcommand(sub =>
      sub
        .setName('level')
        .setDescription('🎚️ Consulta tu nivel en el casino')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
    if (!user) return interaction.reply({ content: '❌ No tienes cuenta. Usa `/start` para registrarte.', ephemeral: true });

    if (sub === 'play') {
      const juego = interaction.options.getString('juego');
      const apuesta = interaction.options.getInteger('apuesta');
      const oponente = interaction.options.getUser('oponente');

      if (apuesta <= 0 || user.balance < apuesta) {
        return interaction.reply({ content: '❌ Apuesta inválida o saldo insuficiente.', ephemeral: true });
      }

      if (!games[juego]) {
        return interaction.reply({ content: '❌ Juego no encontrado.', ephemeral: true });
      }

      // Ejecuta el juego desde la carpeta de utilidades
      try {
        await games[juego](interaction, db, user, apuesta, oponente);
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Hubo un error al procesar el juego.', ephemeral: true });
      }
    }

    if (sub === 'ranking') {
      const top = db.prepare('SELECT user_id, balance FROM users ORDER BY balance DESC LIMIT 10').all();

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Jugadores de Casino')
        .setColor('Gold')
        .setDescription(
          top.map((u, i) => `**${i + 1}.** <@${u.user_id}> — 💰 ${u.balance.toLocaleString()} vk coins`).join('\n')
        )
        .setFooter({ text: 'Los más ricos del casino' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'level') {
      const level = Math.floor(user.balance / 1000);
      const next = (level + 1) * 1000;
      const progreso = user.balance % 1000;

      const embed = new EmbedBuilder()
        .setTitle(`🎚️ Nivel de Casino — ${interaction.user.username}`)
        .setColor('Green')
        .addFields(
          { name: 'Nivel', value: `🧠 ${level}`, inline: true },
          { name: 'Progreso', value: `📊 ${progreso}/${next - level * 1000} vk coins`, inline: true },
          { name: 'Balance', value: `💰 ${user.balance.toLocaleString()} vk coins`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
