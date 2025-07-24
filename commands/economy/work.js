const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

const trabajos = {
  Programador: { min: 800, max: 2000, emoji: '💻' },
  Médico: { min: 900, max: 2200, emoji: '👨‍⚕️' },
  Chef: { min: 600, max: 1500, emoji: '👨‍🍳' },
  Artista: { min: 400, max: 1800, emoji: '🎨' },
  Mecánico: { min: 500, max: 1200, emoji: '🔧' },
  Profesor: { min: 600, max: 1400, emoji: '👨‍🏫' },
  Policía: { min: 700, max: 1600, emoji: '👮‍♂️' },
  Bombero: { min: 650, max: 1550, emoji: '👨‍🚒' },
  Piloto: { min: 1000, max: 2500, emoji: '👨‍✈️' },
  Dentista: { min: 800, max: 1900, emoji: '🦷' }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('💼 Trabaja para ganar dinero'),

  async execute(interaction, client) {
    const userId = interaction.user.id;

    client.config.economyDb.get(`SELECT * FROM economy WHERE user_id = ?`, [userId], async (err, row) => {
      if (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Error al acceder a la base de datos.', ephemeral: true });
      }

      // 🛑 Verifica si el usuario tiene un trabajo
      if (!row || !row.job || !trabajos[row.job]) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('🚫 No tienes trabajo')
              .setDescription('Debes elegir un trabajo primero usando `/job`.')
              .setColor('#ff4444')
          ],
          ephemeral: true
        });
      }

      const now = new Date();
      const lastWork = row.last_work ? new Date(row.last_work) : null;

      // ⏱️ Cooldown de 2 horas
      if (lastWork && (now - lastWork) < 2 * 60 * 60 * 1000) {
        const timeLeft = 2 * 60 * 60 * 1000 - (now - lastWork);
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('⏰ Aún estás cansado')
              .setDescription(`Debes descansar antes de volver a trabajar.\nPodrás trabajar de nuevo en **${minutesLeft} minutos**`)
              .setColor('#ff4444')
              .setThumbnail(interaction.user.displayAvatarURL())
              .setTimestamp()
          ]
        });
      }

      const job = row.job;
      const { min, max, emoji } = trabajos[job];
      const situacion = situaciones[Math.floor(Math.random() * situaciones.length)];
      const salario = Math.floor(Math.random() * (max - min + 1)) + min;

      // 💾 Actualizar salario y hora
      client.config.economyDb.run(
        `UPDATE economy SET wallet = wallet + ?, last_work = ? WHERE user_id = ?`,
        [salario, now.toISOString(), userId]
      );

      const embed = new EmbedBuilder()
        .setTitle('💼 Trabajo Completado')
        .setDescription(`${emoji} Como **${job}**, ${situacion} y ganaste **${salario.toLocaleString()}** monedas`)
        .addFields(
          { name: '💰 Salario Ganado', value: `**${salario.toLocaleString()}** monedas`, inline: true },
          { name: '⏰ Próximo Trabajo', value: 'En 2 horas', inline: true }
        )
        .setColor('#00ff88')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'Sigue trabajando para ganar más dinero' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    });
  }
};
