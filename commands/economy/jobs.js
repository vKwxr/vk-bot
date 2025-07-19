const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jobs')
    .setDescription('💼 Sistema de trabajos avanzado')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Ver trabajos disponibles')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('apply')
        .setDescription('Aplicar a un trabajo')
        .addStringOption(option =>
          option.setName('trabajo')
            .setDescription('Nombre del trabajo')
            .setRequired(true)
            .addChoices(
              { name: '👨‍💻 Programador', value: 'programador' },
              { name: '🎨 Diseñador', value: 'diseñador' },
              { name: '🏪 Vendedor', value: 'vendedor' },
              { name: '🚗 Conductor', value: 'conductor' },
              { name: '🏥 Doctor', value: 'doctor' },
              { name: '👨‍🏫 Profesor', value: 'profesor' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('current')
        .setDescription('Ver tu trabajo actual')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('quit')
        .setDescription('Renunciar a tu trabajo actual')
    ),

  name: 'work',
  description: 'Sistema de trabajos',
  usage: 'vk work list | vk work apply <trabajo> | vk work quit',

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    // Trabajos disponibles
    const trabajos = {
      'programador': { name: '👨‍💻 Programador', salary_min: 500, salary_max: 800, cooldown: 7200000 }, // 2h
      'diseñador': { name: '🎨 Diseñador', salary_min: 300, salary_max: 600, cooldown: 5400000 }, // 1.5h
      'vendedor': { name: '🏪 Vendedor', salary_min: 200, salary_max: 400, cooldown: 3600000 }, // 1h
      'conductor': { name: '🚗 Conductor', salary_min: 150, salary_max: 300, cooldown: 2700000 }, // 45m
      'doctor': { name: '🏥 Doctor', salary_min: 600, salary_max: 1000, cooldown: 10800000 }, // 3h
      'profesor': { name: '👨‍🏫 Profesor', salary_min: 250, salary_max: 500, cooldown: 7200000 } // 2h
    };

    if (subcommand === 'list') {
      const embed = new EmbedBuilder()
        .setTitle('💼 Trabajos Disponibles en VK Community')
        .setDescription('Usa `/jobs apply <trabajo>` para aplicar a un trabajo')
        .setColor('#9966ff')
        .setTimestamp();

      Object.entries(trabajos).forEach(([key, job]) => {
        const cooldownHours = job.cooldown / 3600000;
        embed.addFields({
          name: job.name,
          value: `💰 $${job.salary_min}-${job.salary_max}/trabajo\n⏰ Cooldown: ${cooldownHours}h`,
          inline: true
        });
      });

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'apply') {
      const trabajoKey = interaction.options.getString('trabajo');
      const trabajo = trabajos[trabajoKey];

      if (!trabajo) {
        return interaction.reply({ content: '❌ Trabajo no válido.', ephemeral: true });
      }

      // Verificar si ya tiene trabajo
      economyDb.get('SELECT * FROM jobs WHERE user_id = ?', [userId], async (err, row) => {
        if (row) {
          return interaction.reply({ 
            content: `❌ Ya tienes el trabajo de **${row.job_name}**. Usa \`/jobs quit\` para renunciar primero.`, 
            ephemeral: true 
          });
        }

        // Asignar trabajo
        economyDb.run(
          'INSERT OR REPLACE INTO jobs (user_id, job_name, salary_min, salary_max, cooldown) VALUES (?, ?, ?, ?, ?)',
          [userId, trabajo.name, trabajo.salary_min, trabajo.salary_max, trabajo.cooldown],
          async (err) => {
            if (err) {
              return interaction.reply({ content: '❌ Error al aplicar al trabajo.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
              .setTitle('🎉 ¡Felicidades!')
              .setDescription(`Has sido contratado como **${trabajo.name}**`)
              .addFields(
                { name: '💰 Salario', value: `$${trabajo.salary_min}-${trabajo.salary_max} por trabajo`, inline: true },
                { name: '⏰ Cooldown', value: `${trabajo.cooldown / 3600000} horas`, inline: true },
                { name: '📝 Instrucciones', value: 'Usa `/work` para trabajar y ganar dinero', inline: false }
              )
              .setColor('#00ff00')
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
          }
        );
      });

    } else if (subcommand === 'current') {
      economyDb.get('SELECT * FROM jobs WHERE user_id = ?', [userId], async (err, row) => {
        if (!row) {
          return interaction.reply({ 
            content: '❌ No tienes ningún trabajo. Usa `/jobs apply` para conseguir uno.', 
            ephemeral: true 
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('💼 Tu Trabajo Actual')
          .addFields(
            { name: '🏷️ Puesto', value: row.job_name, inline: true },
            { name: '💰 Salario', value: `$${row.salary_min}-${row.salary_max}`, inline: true },
            { name: '⏰ Cooldown', value: `${row.cooldown / 3600000}h`, inline: true }
          )
          .setColor('#9966ff')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      });

    } else if (subcommand === 'quit') {
      economyDb.get('SELECT * FROM jobs WHERE user_id = ?', [userId], async (err, row) => {
        if (!row) {
          return interaction.reply({ 
            content: '❌ No tienes ningún trabajo del cual renunciar.', 
            ephemeral: true 
          });
        }

        economyDb.run('DELETE FROM jobs WHERE user_id = ?', [userId], async (err) => {
          if (err) {
            return interaction.reply({ content: '❌ Error al renunciar.', ephemeral: true });
          }

          const embed = new EmbedBuilder()
            .setTitle('👋 Has Renunciado')
            .setDescription(`Has renunciado a tu trabajo de **${row.job_name}**`)
            .setColor('#ff6b6b')
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        });
      });
    }
  },

  async run(message, args, client) {
    if (!args.length) {
      return message.reply('❌ **Uso:** `vk work list` | `vk work apply <trabajo>` | `vk work quit`');
    }

    const action = args[0].toLowerCase();

    if (action === 'list') {
      await this.showJobs(message);
    } else if (action === 'apply') {
      const trabajo = args[1];
      if (!trabajo) {
        return message.reply('❌ **Especifica un trabajo:** `vk work apply <trabajo>`');
      }
      await this.applyJob(message, trabajo);
    } else if (action === 'quit') {
      await this.quitJob(message);
    }
  },

  async showJobs(context) {
    const jobs = [
      { name: '🍕 Repartidor de Pizza', id: 'pizza', salary: '50-100', description: 'Entrega pizzas por la ciudad' },
      { name: '💻 Programador', id: 'programmer', salary: '200-400', description: 'Desarrolla aplicaciones' },
      { name: '🏥 Doctor', id: 'doctor', salary: '300-500', description: 'Ayuda a los enfermos' },
      { name: '👮 Policía', id: 'police', salary: '150-250', description: 'Mantiene el orden' },
      { name: '🚗 Conductor', id: 'driver', salary: '80-150', description: 'Transporta pasajeros' }
    ];

    const embed = new EmbedBuilder()
      .setTitle('💼 Trabajos Disponibles')
      .setDescription('Lista de trabajos que puedes realizar:')
      .setColor('#0099ff');

    jobs.forEach(job => {
      embed.addFields({
        name: job.name,
        value: `💰 Salario: ${job.salary} monedas\n📝 ${job.description}\n🆔 ID: \`${job.id}\``,
        inline: true
      });
    });

    embed.setFooter({ text: 'Usa /jobs apply <trabajo> para aplicar' });

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed] })
      : await context.reply({ embeds: [embed] });
  },

  async applyJob(context, jobId) {
    const isInteraction = context.replied !== undefined;
    const userId = (context.user || context.author).id;

    const jobs = {
      pizza: { name: '🍕 Repartidor de Pizza', min: 50, max: 100 },
      programmer: { name: '💻 Programador', min: 200, max: 400 },
      doctor: { name: '🏥 Doctor', min: 300, max: 500 },
      police: { name: '👮 Policía', min: 150, max: 250 },
      driver: { name: '🚗 Conductor', min: 80, max: 150 }
    };

    if (!jobs[jobId]) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Trabajo No Válido')
        .setDescription('Ese trabajo no existe. Usa `/jobs list` para ver trabajos disponibles.')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [embed], ephemeral: true })
        : await context.reply({ embeds: [embed] });
    }

    const job = jobs[jobId];

    // Verificar si ya tiene trabajo
    context.client.config.economyDb.get(
      `SELECT * FROM jobs WHERE user_id = ?`,
      [userId],
      async (err, existingJob) => {
        if (existingJob) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Ya Tienes Trabajo')
            .setDescription(`Ya trabajas como **${existingJob.job_name}**\nUsa \`/jobs quit\` para renunciar primero.`)
            .setColor('#ff0000');

          return isInteraction 
            ? await context.reply({ embeds: [embed], ephemeral: true })
            : await context.reply({ embeds: [embed] });
        }

        // Agregar trabajo
        context.client.config.economyDb.run(
          `INSERT OR REPLACE INTO jobs (user_id, job_name, salary_min, salary_max, cooldown) VALUES (?, ?, ?, ?, ?)`,
          [userId, job.name, job.min, job.max, 0],
          async function(err) {
            if (err) {
              console.error('Error aplicando trabajo:', err);
              return;
            }

            const embed = new EmbedBuilder()
              .setTitle('✅ ¡Trabajo Obtenido!')
              .setDescription(`¡Felicidades! Ahora trabajas como **${job.name}**`)
              .addFields(
                { name: '💰 Salario', value: `${job.min}-${job.max} monedas`, inline: true },
                { name: '⏰ Trabajo', value: 'Usa `/work` para trabajar', inline: true }
              )
              .setColor('#00ff00')
              .setTimestamp();

            return isInteraction 
              ? await context.reply({ embeds: [embed] })
              : await context.reply({ embeds: [embed] });
          }
        );
      }
    );
  },

  async quitJob(context) {
    const isInteraction = context.replied !== undefined;
    const userId = (context.user || context.author).id;

    context.client.config.economyDb.get(
      `SELECT * FROM jobs WHERE user_id = ?`,
      [userId],
      async (err, job) => {
        if (!job) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Sin Trabajo')
            .setDescription('No tienes ningún trabajo actualmente.')
            .setColor('#ff0000');

          return isInteraction 
            ? await context.reply({ embeds: [embed], ephemeral: true })
            : await context.reply({ embeds: [embed] });
        }

        context.client.config.economyDb.run(
          `DELETE FROM jobs WHERE user_id = ?`,
          [userId],
          async function(err) {
            if (err) {
              console.error('Error renunciando:', err);
              return;
            }

            const embed = new EmbedBuilder()
              .setTitle('✅ Renuncia Procesada')
              .setDescription(`Has renunciado a tu trabajo como **${job.job_name}**`)
              .setColor('#ff9900')
              .setTimestamp();

            return isInteraction 
              ? await context.reply({ embeds: [embed] })
              : await context.reply({ embeds: [embed] });
          }
        );
      }
    );
  }
};