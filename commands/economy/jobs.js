const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const TRABAJOS = {
  programador: { name: '💻 Programador', min: 300, max: 600, cooldown: 2 },
  doctor: { name: '🏥 Doctor', min: 500, max: 900, cooldown: 3 },
  chef: { name: '👨‍🍳 Chef', min: 250, max: 450, cooldown: 1.5 },
  mecánico: { name: '🔧 Mecánico', min: 200, max: 400, cooldown: 1 },
  streamer: { name: '📹 Streamer', min: 100, max: 300, cooldown: 0.5 },
  gamer: { name: '🎮 Gamer Pro', min: 400, max: 700, cooldown: 2.5 },
  repartidor: { name: '🍕 Repartidor de Pizza', min: 100, max: 250, cooldown: 0.75 },
  profesor: { name: '👨‍🏫 Profesor', min: 350, max: 550, cooldown: 2 }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jobs')
    .setDescription('💼 Sistema de trabajos')
    .addSubcommand(cmd =>
      cmd.setName('list').setDescription('Ver trabajos disponibles'))
    .addSubcommand(cmd =>
      cmd.setName('apply')
        .setDescription('Aplicar a un trabajo')
        .addStringOption(option =>
          option.setName('trabajo')
            .setDescription('Elige un trabajo')
            .setRequired(true)
            .addChoices(...Object.entries(TRABAJOS).map(([id, t]) => ({
              name: t.name, value: id
            })))
        )
    )
    .addSubcommand(cmd =>
      cmd.setName('current').setDescription('Ver tu trabajo actual'))
    .addSubcommand(cmd =>
      cmd.setName('quit').setDescription('Renunciar al trabajo actual')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const db = client.config.economyDb;
    const userId = interaction.user.id;

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setTitle('💼 Trabajos Disponibles')
        .setDescription('Selecciona un trabajo usando `/jobs apply <trabajo>`')
        .setColor('#00bfff');

      for (const [id, job] of Object.entries(TRABAJOS)) {
        embed.addFields({
          name: job.name,
          value: `💰 **Salario:** $${job.min}-${job.max}\n⏳ **Cooldown:** ${job.cooldown}h`,
          inline: true
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'apply') {
      const jobId = interaction.options.getString('trabajo');
      const job = TRABAJOS[jobId];
      if (!job) return interaction.reply({ content: '❌ Trabajo inválido.', ephemeral: true });

      db.get('SELECT * FROM jobs WHERE user_id = ?', [userId], (err, row) => {
        if (row) {
          return interaction.reply({
            content: `❌ Ya trabajas como **${row.job_name}**. Usa \`/jobs quit\` para renunciar primero.`,
            ephemeral: true
          });
        }

        db.run(
          'INSERT INTO jobs (user_id, job_name, salary_min, salary_max, cooldown) VALUES (?, ?, ?, ?, ?)',
          [userId, job.name, job.min, job.max, job.cooldown * 3600000],
          () => {
            const embed = new EmbedBuilder()
              .setTitle('✅ ¡Contratado!')
              .setDescription(`Ahora trabajas como **${job.name}**`)
              .addFields(
                { name: '💰 Salario', value: `$${job.min}-${job.max}`, inline: true },
                { name: '⏳ Cooldown', value: `${job.cooldown}h`, inline: true }
              )
              .setColor('#00ff99')
              .setTimestamp();

            interaction.reply({ embeds: [embed] });
          }
        );
      });
    }

    if (sub === 'current') {
      db.get('SELECT * FROM jobs WHERE user_id = ?', [userId], (err, row) => {
        if (!row) {
          return interaction.reply({
            content: '❌ No tienes ningún trabajo. Usa `/jobs list` para ver opciones.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🧾 Trabajo Actual')
          .addFields(
            { name: '🏷️ Puesto', value: row.job_name, inline: true },
            { name: '💰 Salario', value: `$${row.salary_min}-${row.salary_max}`, inline: true },
            { name: '⏳ Cooldown', value: `${row.cooldown / 3600000}h`, inline: true }
          )
          .setColor('#f1c40f')
          .setTimestamp();

        interaction.reply({ embeds: [embed] });
      });
    }

    if (sub === 'quit') {
      db.get('SELECT * FROM jobs WHERE user_id = ?', [userId], (err, row) => {
        if (!row) {
          return interaction.reply({ content: '❌ No estás trabajando actualmente.', ephemeral: true });
        }

        db.run('DELETE FROM jobs WHERE user_id = ?', [userId], () => {
          const embed = new EmbedBuilder()
            .setTitle('👋 Renuncia Exitosa')
            .setDescription(`Renunciaste al trabajo de **${row.job_name}**`)
            .setColor('#ff4d4d')
            .setTimestamp();

          interaction.reply({ embeds: [embed] });
        });
      });
    }
  }
};
