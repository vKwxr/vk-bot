
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('🏆 Ve tu nivel actual o el de otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del cual ver el nivel')
        .setRequired(false)),

  async execute(interaction, client) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;

    if (usuario.bot) {
      return interaction.reply({
        content: '❌ Los bots no tienen niveles.',
        ephemeral: true
      });
    }

    client.config.levelsDb.get(
      `SELECT * FROM levels WHERE user_id = ?`,
      [usuario.id],
      async (err, row) => {
        if (err) {
          return interaction.reply({
            content: '❌ Error al obtener los datos.',
            ephemeral: true
          });
        }

        if (!row) {
          const embed = new EmbedBuilder()
            .setTitle('📊 Sin Datos')
            .setDescription(`${usuario.tag} aún no tiene actividad registrada`)
            .setColor('#e74c3c')
            .setThumbnail(usuario.displayAvatarURL())
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        // Obtener posición en el ranking
        client.config.levelsDb.get(
          `SELECT COUNT(*) as position FROM levels WHERE xp > ? OR (xp = ? AND user_id < ?)`,
          [row.xp, row.xp, usuario.id],
          async (err, positionRow) => {
            const position = (positionRow?.position || 0) + 1;
            const xpForNextLevel = (row.level * 1000);
            const xpProgress = row.xp - ((row.level - 1) * 1000);
            const progressBar = createProgressBar(xpProgress, 1000);

            const embed = new EmbedBuilder()
              .setTitle('🏆 Nivel de Usuario')
              .setDescription(`Estadísticas de **${usuario.tag}**`)
              .addFields(
                { name: '📊 Nivel Actual', value: `${row.level}`, inline: true },
                { name: '💫 XP Total', value: `${row.xp.toLocaleString()}`, inline: true },
                { name: '🎯 Posición', value: `#${position}`, inline: true },
                { name: '📈 Progreso al siguiente nivel', value: `${progressBar}\n${xpProgress}/1000 XP`, inline: false },
                { name: '🎯 XP para nivel ${row.level + 1}', value: `${1000 - xpProgress} XP restante`, inline: true }
              )
              .setColor('#gold')
              .setThumbnail(usuario.displayAvatarURL())
              .setFooter({ text: 'Sigue chateando para ganar más XP!' })
              .setTimestamp();

            await interaction.reply({ embeds: [embed] });
          }
        );
      }
    );
  },

  name: 'rank',
  async run(message, args, client) {
    const usuario = message.mentions.users.first() || message.author;

    if (usuario.bot) {
      return message.reply('❌ Los bots no tienen niveles.');
    }

    client.config.levelsDb.get(
      `SELECT * FROM levels WHERE user_id = ?`,
      [usuario.id],
      async (err, row) => {
        if (!row) {
          return message.reply(`${usuario.tag} aún no tiene actividad registrada.`);
        }

        client.config.levelsDb.get(
          `SELECT COUNT(*) as position FROM levels WHERE xp > ?`,
          [row.xp],
          async (err, positionRow) => {
            const position = (positionRow?.position || 0) + 1;
            const xpProgress = row.xp - ((row.level - 1) * 1000);
            const progressBar = createProgressBar(xpProgress, 1000);

            const embed = new EmbedBuilder()
              .setTitle('🏆 Nivel de Usuario')
              .setDescription(`**${usuario.tag}**\nNivel: ${row.level} | XP: ${row.xp.toLocaleString()} | Posición: #${position}`)
              .addFields(
                { name: '📈 Progreso', value: `${progressBar}\n${xpProgress}/1000 XP`, inline: false }
              )
              .setColor('#gold')
              .setThumbnail(usuario.displayAvatarURL())
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          }
        );
      }
    );
  }
};

function createProgressBar(current, max, length = 20) {
  const percentage = Math.min(current / max, 1);
  const progress = Math.round(percentage * length);
  const empty = length - progress;
  
  const progressBar = '█'.repeat(progress) + '░'.repeat(empty);
  return `[${progressBar}] ${Math.round(percentage * 100)}%`;
}
