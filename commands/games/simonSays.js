const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3')('./economy/data.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simon')
    .setDescription('🟢🔴🔵🟡 ¡Simon dice! Repite la secuencia correctamente.')
    .addStringOption(option =>
      option.setName('dificultad')
        .setDescription('Nivel de dificultad')
        .addChoices(
          { name: 'Fácil', value: 'easy' },
          { name: 'Normal', value: 'normal' },
          { name: 'Difícil', value: 'hard' }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const dificultad = interaction.options.getString('dificultad');
    const colores = ['🟥', '🟦', '🟨', '🟩'];
    const tiempos = { easy: 2000, normal: 1500, hard: 1000 };
    const secuencia = [];

    let rondas = dificultad === 'easy' ? 3 : dificultad === 'normal' ? 5 : 7;

    const getRandomColor = () => colores[Math.floor(Math.random() * colores.length)];

    for (let i = 0; i < rondas; i++) {
      secuencia.push(getRandomColor());
    }

    const mostrarSecuencia = async () => {
      const embed = new EmbedBuilder()
        .setTitle('🎮 ¡Simon Dice!')
        .setDescription('Memoriza la secuencia de colores...')
        .setColor('Random');
      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

      for (let color of secuencia) {
        await new Promise(res => setTimeout(res, tiempos[dificultad]));
        await msg.edit({ embeds: [embed.setDescription(color)] });
      }

      await new Promise(res => setTimeout(res, 500));
      await msg.edit({ embeds: [embed.setDescription('✅ ¡Tu turno! Repite la secuencia usando los botones.')] });

      const buttons = colores.map((emoji, i) =>
        new ButtonBuilder()
          .setCustomId(`color_${i}`)
          .setLabel(emoji)
          .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.followUp({
        content: `Presiona los botones en el orden correcto.`,
        components: [row],
        ephemeral: true
      });

      let userSecuencia = [];
      const collector = msg.channel.createMessageComponentCollector({
        time: 15000,
        filter: i => i.user.id === userId
      });

      collector.on('collect', async i => {
        const index = parseInt(i.customId.split('_')[1]);
        const color = colores[index];
        userSecuencia.push(color);

        await i.deferUpdate();

        if (userSecuencia.length === secuencia.length) {
          collector.stop();
        }
      });

      collector.on('end', async () => {
        const esCorrecto = JSON.stringify(userSecuencia) === JSON.stringify(secuencia);

        if (esCorrecto) {
          db.prepare(`
            INSERT INTO game_stats(user_id, game, wins, streak)
            VALUES(?, 'simon', 1, 1)
            ON CONFLICT(user_id, game)
            DO UPDATE SET
              wins = wins + 1,
              streak = streak + 1
          `).run(userId);

          await interaction.followUp(`🎉 ¡Correcto! Has repetido la secuencia como un verdadero pro 🔥`);
        } else {
          db.prepare(`
            INSERT INTO game_stats(user_id, game, wins, streak)
            VALUES(?, 'simon', 0, 0)
            ON CONFLICT(user_id, game)
            DO UPDATE SET
              streak = 0
          `).run(userId);

          await interaction.followUp(`❌ Incorrecto. La secuencia era:\n${secuencia.join(' ')}`);
        }
      });
    };

    mostrarSecuencia();
  }
};
