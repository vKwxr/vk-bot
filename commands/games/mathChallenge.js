const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('better-sqlite3')('./economy/data.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('math')
    .setDescription('🧠 Resuelve una operación matemática antes que se acabe el tiempo')
    .addStringOption(option =>
      option.setName('dificultad')
        .setDescription('Selecciona dificultad')
        .addChoices(
          { name: 'Fácil', value: 'easy' },
          { name: 'Normal', value: 'normal' },
          { name: 'Difícil', value: 'hard' }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const dificultad = interaction.options.getString('dificultad');
    const userId = interaction.user.id;

    const dificultades = {
      easy: { min: 1, max: 10, op: ['+', '-'], tiempo: 15000 },
      normal: { min: 10, max: 50, op: ['+', '-', '*'], tiempo: 10000 },
      hard: { min: 50, max: 100, op: ['+', '-', '*', '/'], tiempo: 8000 }
    };

    const dif = dificultades[dificultad];
    const num1 = Math.floor(Math.random() * (dif.max - dif.min) + dif.min);
    const num2 = Math.floor(Math.random() * (dif.max - dif.min) + dif.min);
    const operador = dif.op[Math.floor(Math.random() * dif.op.length)];

    const expresion = `${num1} ${operador} ${num2}`;
    let resultado = eval(expresion);
    resultado = operador === '/' ? parseFloat(resultado.toFixed(2)) : resultado;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveup')
        .setLabel('😵 Me rindo')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: `🧠 Resuelve esta operación en **${dif.tiempo / 1000}s**:\n\`\`\`${expresion} = ?\`\`\``,
      components: [row]
    });

    const collector = interaction.channel.createMessageCollector({
      filter: m => m.author.id === userId,
      time: dif.tiempo
    });

    let acierto = false;

    collector.on('collect', async m => {
      if (parseFloat(m.content) === resultado) {
        acierto = true;
        collector.stop();

        db.prepare(`
          INSERT INTO game_stats(user_id, game, wins, streak)
          VALUES(?, 'math', 1, 1)
          ON CONFLICT(user_id, game)
          DO UPDATE SET
            wins = wins + 1,
            streak = streak + 1
        `).run(userId);

        await interaction.followUp(`✅ ¡Correcto, ${interaction.user.username}! La respuesta era **${resultado}** 🎉`);
      } else {
        await interaction.followUp('❌ Incorrecto. Intenta de nuevo.');
      }
    });

    collector.on('end', async () => {
      if (!acierto) {
        db.prepare(`
          INSERT INTO game_stats(user_id, game, wins, streak)
          VALUES(?, 'math', 0, 0)
          ON CONFLICT(user_id, game)
          DO UPDATE SET
            streak = 0
        `).run(userId);

        await interaction.followUp(`⏰ Se acabó el tiempo o te rendiste. La respuesta era **${resultado}**`);
      }
    });

    const btn = interaction.channel.createMessageComponentCollector({ time: dif.tiempo });
    btn.on('collect', async i => {
      if (i.customId === 'giveup' && i.user.id === userId) {
        acierto = false;
        collector.stop();
        await i.update({ content: '🛑 Te rendiste.', components: [] });
      }
    });
  }
};
