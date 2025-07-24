const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('🎂 Gestiona tu fecha de cumpleaños')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Establece tu fecha de cumpleaños')
        .addIntegerOption(option =>
          option.setName('dia')
            .setDescription('Día (1-31)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(31))
        .addIntegerOption(option =>
          option.setName('mes')
            .setDescription('Mes (1-12)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(12))
        .addIntegerOption(option =>
          option.setName('año')
            .setDescription('Año (opcional)')
            .setRequired(false)
            .setMinValue(1900)
            .setMaxValue(new Date().getFullYear())))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Ver cumpleaños de un usuario')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('Usuario a consultar')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Eliminar tu fecha de cumpleaños')),

  async execute(interaction, client) {
    const { db } = client.config;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const dia = interaction.options.getInteger('dia');
      const mes = interaction.options.getInteger('mes');
      const año = interaction.options.getInteger('año');

      const fecha = new Date(año || 2000, mes - 1, dia);
      if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1) {
        return interaction.reply({
          content: '❌ Fecha inválida.',
          ephemeral: true
        });
      }

      const birthday = `${dia.toString().padStart(2, '0')}-${mes.toString().padStart(2, '0')}`;

      db.run(
        `INSERT OR REPLACE INTO birthdays (user_id, birthday, year) VALUES (?, ?, ?)`,
        [interaction.user.id, birthday, año],
        function(err) {
          if (err) {
            return interaction.reply({
              content: '❌ Error al guardar cumpleaños.',
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setTitle('🎂 Cumpleaños Guardado')
            .setDescription(`Tu cumpleaños ha sido establecido para el **${dia}/${mes}${año ? `/${año}` : ''}**`)
            .setColor('#ff69b4')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          interaction.reply({ embeds: [embed] });
        }
      );
    } else if (subcommand === 'view') {
      const user = interaction.options.getUser('usuario') || interaction.user;

      db.get(
        `SELECT * FROM birthdays WHERE user_id = ?`,
        [user.id],
        async (err, row) => {
          if (!row) {
            return interaction.reply({
              content: `❌ ${user.id === interaction.user.id ? 'No tienes' : `${user.username} no tiene`} cumpleaños registrado.`,
              ephemeral: true
            });
          }

          const [dia, mes] = row.birthday.split('-');
          const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

          const embed = new EmbedBuilder()
            .setTitle(`🎂 Cumpleaños de ${user.username}`)
            .setDescription(`**${dia} de ${meses[parseInt(mes) - 1]}${row.year ? ` de ${row.year}` : ''}**`)
            .setColor('#ff69b4')
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }
      );
    } else if (subcommand === 'delete') {
      db.run(
        `DELETE FROM birthdays WHERE user_id = ?`,
        [interaction.user.id],
        function(err) {
          if (err || this.changes === 0) {
            return interaction.reply({
              content: '❌ No tienes cumpleaños registrado.',
              ephemeral: true
            });
          }

          interaction.reply({
            content: '✅ Tu cumpleaños ha sido eliminado.',
            ephemeral: true
          });
        }
      );
    }
  }
};