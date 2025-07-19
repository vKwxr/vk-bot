
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jobs')
    .setDescription('Sistema de trabajos')
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('Ver trabajos disponibles')
    )
    .addSubcommand(subcommand =>
      subcommand.setName('apply')
        .setDescription('Aplicar a un trabajo')
        .addStringOption(option =>
          option.setName('trabajo')
            .setDescription('Nombre del trabajo')
            .setRequired(true)
            .addChoices(
              { name: '🍕 Repartidor de Pizza', value: 'pizza' },
              { name: '💻 Programador', value: 'programmer' },
              { name: '🏥 Doctor', value: 'doctor' },
              { name: '👮 Policía', value: 'police' },
              { name: '🚗 Conductor', value: 'driver' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('quit')
        .setDescription('Renunciar a tu trabajo actual')
    ),

  name: 'work',
  description: 'Sistema de trabajos',
  usage: 'vk work list | vk work apply <trabajo> | vk work quit',

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      await this.showJobs(interaction);
    } else if (subcommand === 'apply') {
      const trabajo = interaction.options.getString('trabajo');
      await this.applyJob(interaction, trabajo);
    } else if (subcommand === 'quit') {
      await this.quitJob(interaction);
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
