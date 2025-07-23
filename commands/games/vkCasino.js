const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3')('./main.db');
const games = require('../../utils/casinoGames');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('🎰 Accede a todos los juegos de casino')
    .addSubcommand(sub => sub
      .setName('play')
      .setDescription('Juega a un juego de casino')
      .addStringOption(opt =>
        opt.setName('juego')
          .setDescription('Nombre del juego (slots, blackjack, etc.)')
          .setRequired(true)
          .addChoices(
            { name: 'Slots 🎰', value: 'slots' },
            { name: 'Blackjack 🃏', value: 'blackjack' },
            { name: 'Roulette 🎯', value: 'roulette' },
            { name: 'Poker ♠️', value: 'poker' } // si decides usarlo luego, está listo
          )
      )
      .addIntegerOption(opt =>
        opt.setName('apuesta')
          .setDescription('Cantidad de vk coins a apostar')
          .setRequired(true)
      )
      .addUserOption(opt =>
        opt.setName('oponente')
          .setDescription('Reta a otro usuario (solo en juegos PvP)')
      )
    )
    .addSubcommand(sub =>
      sub.setName('ranking')
        .setDescription('📈 Muestra el ranking global de casino')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'play') {
      const juego = interaction.options.getString('juego');
      const apuesta = interaction.options.getInteger('apuesta');
      const oponente = interaction.options.getUser('oponente');

      const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
      if (!user) return interaction.reply({ content: '❌ No tienes cuenta. Usa /start para comenzar.', ephemeral: true });
      if (user.balance < apuesta || apuesta <= 0) return interaction.reply({ content: '❌ Apuesta inválida o insuficiente saldo.', ephemeral: true });

      if (!games[juego]) return interaction.reply({ content: '❌ Juego no disponible.', ephemeral: true });

      try {
        await games[juego](interaction, db, user, apuesta, oponente);
      } catch (error) {
        console.error('Error al ejecutar el juego:', error);
        interaction.reply({ content: '❌ Ocurrió un error al ejecutar el juego.', ephemeral: true });
      }
    }

    if (sub === 'ranking') {
      const top = db.prepare('SELECT * FROM users ORDER BY balance DESC LIMIT 10').all();
      const embed = new EmbedBuilder()
        .setTitle('🏆 Ranking Global de Casino')
        .setColor('Gold')
        .setDescription(top.map((u, i) => `**${i + 1}.** <@${u.user_id}> — 💰 ${u.balance.toLocaleString()} vk coins`).join('\n'))
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    }
  }
};
