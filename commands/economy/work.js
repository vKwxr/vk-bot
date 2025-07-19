
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const trabajos = [
  { nombre: 'Programador', minSalario: 800, maxSalario: 2000, emoji: '💻' },
  { nombre: 'Médico', minSalario: 900, maxSalario: 2200, emoji: '👨‍⚕️' },
  { nombre: 'Chef', minSalario: 600, maxSalario: 1500, emoji: '👨‍🍳' },
  { nombre: 'Artista', minSalario: 400, maxSalario: 1800, emoji: '🎨' },
  { nombre: 'Mecánico', minSalario: 500, maxSalario: 1200, emoji: '🔧' },
  { nombre: 'Profesor', minSalario: 600, maxSalario: 1400, emoji: '👨‍🏫' },
  { nombre: 'Policía', minSalario: 700, maxSalario: 1600, emoji: '👮‍♂️' },
  { nombre: 'Bombero', minSalario: 650, maxSalario: 1550, emoji: '👨‍🚒' },
  { nombre: 'Piloto', minSalario: 1000, maxSalario: 2500, emoji: '👨‍✈️' },
  { nombre: 'Dentista', minSalario: 800, maxSalario: 1900, emoji: '🦷' }
];

const situaciones = [
  'trabajaste duro todo el día',
  'hiciste horas extra',
  'completaste un proyecto importante',
  'ayudaste a un compañero',
  'resolviste un problema difícil',
  'tuviste un día productivo',
  'impresionaste a tu jefe',
  'cerraste una venta importante',
  'terminaste temprano',
  'recibiste una bonificación'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('💼 Trabaja para ganar dinero'),

  async execute(interaction, client) {
    const userId = interaction.user.id;

    client.config.economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error(err);
          return interaction.reply({
            content: '❌ Error al acceder a la base de datos.',
            ephemeral: true
          });
        }

        const now = new Date();
        const lastWork = row ? new Date(row.last_work) : null;

        // Verificar cooldown de 2 horas
        if (lastWork && (now - lastWork) < 2 * 60 * 60 * 1000) {
          const timeLeft = 2 * 60 * 60 * 1000 - (now - lastWork);
          const minutesLeft = Math.floor(timeLeft / (1000 * 60));

          const embed = new EmbedBuilder()
            .setTitle('⏰ Aún estás cansado')
            .setDescription(`Debes descansar antes de volver a trabajar.\nPodrás trabajar de nuevo en **${minutesLeft} minutos**`)
            .setColor('#ff4444')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        // Seleccionar trabajo y situación aleatorios
        const trabajo = trabajos[Math.floor(Math.random() * trabajos.length)];
        const situacion = situaciones[Math.floor(Math.random() * situaciones.length)];
        
        // Calcular salario
        const salario = Math.floor(Math.random() * (trabajo.maxSalario - trabajo.minSalario + 1)) + trabajo.minSalario;

        // Actualizar base de datos
        if (row) {
          client.config.economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_work = ? WHERE user_id = ?`,
            [salario, now.toISOString(), userId]
          );
        } else {
          client.config.economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_work) VALUES (?, ?, ?)`,
            [userId, salario, now.toISOString()]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('💼 Trabajo Completado')
          .setDescription(`${trabajo.emoji} Como **${trabajo.nombre}**, ${situacion} y ganaste **${salario.toLocaleString()}** monedas`)
          .addFields(
            { name: '💰 Salario Ganado', value: `**${salario.toLocaleString()}** monedas`, inline: true },
            { name: '⏰ Próximo Trabajo', value: 'En 2 horas', inline: true }
          )
          .setColor('#00ff88')
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Sigue trabajando para ganar más dinero' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    );
  },

  name: 'work',
  async run(message, args, client) {
    const userId = message.author.id;

    client.config.economyDb.get(
      `SELECT * FROM economy WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error(err);
          return message.reply('❌ Error al acceder a la base de datos.');
        }

        const now = new Date();
        const lastWork = row ? new Date(row.last_work) : null;

        if (lastWork && (now - lastWork) < 2 * 60 * 60 * 1000) {
          const timeLeft = 2 * 60 * 60 * 1000 - (now - lastWork);
          const minutesLeft = Math.floor(timeLeft / (1000 * 60));

          const embed = new EmbedBuilder()
            .setTitle('⏰ Aún estás cansado')
            .setDescription(`Debes descansar antes de volver a trabajar.\nPodrás trabajar de nuevo en **${minutesLeft} minutos**`)
            .setColor('#ff4444')
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();

          return message.reply({ embeds: [embed] });
        }

        const trabajo = trabajos[Math.floor(Math.random() * trabajos.length)];
        const situacion = situaciones[Math.floor(Math.random() * situaciones.length)];
        const salario = Math.floor(Math.random() * (trabajo.maxSalario - trabajo.minSalario + 1)) + trabajo.minSalario;

        if (row) {
          client.config.economyDb.run(
            `UPDATE economy SET wallet = wallet + ?, last_work = ? WHERE user_id = ?`,
            [salario, now.toISOString(), userId]
          );
        } else {
          client.config.economyDb.run(
            `INSERT INTO economy (user_id, wallet, last_work) VALUES (?, ?, ?)`,
            [userId, salario, now.toISOString()]
          );
        }

        const embed = new EmbedBuilder()
          .setTitle('💼 Trabajo Completado')
          .setDescription(`${trabajo.emoji} Como **${trabajo.nombre}**, ${situacion} y ganaste **${salario.toLocaleString()}** monedas`)
          .addFields(
            { name: '💰 Salario Ganado', value: `**${salario.toLocaleString()}** monedas`, inline: true },
            { name: '⏰ Próximo Trabajo', value: 'En 2 horas', inline: true }
          )
          .setColor('#00ff88')
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: 'Sigue trabajando para ganar más dinero' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    );
  }
};
