const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('🆙 Ver tu nivel o el de otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario del que quieres ver el nivel')
        .setRequired(false)
    ),

  name: 'level',
  description: 'Ver nivel de usuario',
  usage: 'vk level [@usuario]',

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    await this.handleLevel(interaction, targetUser, client);
  },

  async run(message, args, client) {
    const targetUser = message.mentions.users.first() || message.author;
    await this.handleLevel(message, targetUser, client);
  },

  async handleLevel(context, targetUser, client) {
    const { levelsDb } = client.config;
    const isInteraction = context.replied !== undefined;

    try {
      // Obtener datos del usuario
      const userData = await new Promise((resolve, reject) => {
        levelsDb.get('SELECT * FROM levels WHERE user_id = ?', [targetUser.id], (err, row) => {
          if (err) reject(err);
          else resolve(row || { user_id: targetUser.id, xp: 0, level: 1 });
        });
      });

      const { xp, level } = userData;
      const xpNeeded = level * 1000;
      const xpProgress = xp % 1000;
      const progressPercentage = Math.floor((xpProgress / xpNeeded) * 100);

      // Crear barra de progreso con emojis
      const progressBar = this.createProgressBar(progressPercentage);

      // Obtener posición en ranking
      const rankPosition = await new Promise((resolve) => {
        levelsDb.all('SELECT user_id, level, xp FROM levels ORDER BY level DESC, xp DESC', [], (err, rows) => {
          if (err) resolve('N/A');
          else {
            const position = rows.findIndex(row => row.user_id === targetUser.id) + 1;
            resolve(position || 'N/A');
          }
        });
      });

      const embed = new EmbedBuilder()
        .setTitle(`🆙 Nivel de ${targetUser.username}`)
        .setDescription(`**Nivel:** ${level}\n**XP:** ${xpProgress}/${xpNeeded}\n**Progreso:** ${progressBar} ${progressPercentage}%`)
        .addFields(
          { name: '📊 XP Total', value: `${xp} XP`, inline: true },
          { name: '🏆 Ranking', value: `#${rankPosition}`, inline: true },
          { name: '🎯 Siguiente Nivel', value: `${xpNeeded - xpProgress} XP restantes`, inline: true }
        )
        .setColor(this.getLevelColor(level))
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: 'vK • Sistema de Niveles' })
        .setTimestamp();

      return isInteraction 
        ? await context.reply({ embeds: [embed] })
        : await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en comando level:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('No se pudo obtener la información de nivel.')
        .setColor('#ff0000');

      return isInteraction 
        ? await context.reply({ embeds: [errorEmbed], ephemeral: true })
        : await context.reply({ embeds: [errorEmbed] });
    }
  },

  createProgressBar(percentage) {
    const totalBars = 20;
    const filledBars = Math.floor((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;

    return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  },

  getLevelColor(level) {
    if (level >= 50) return '#ff0000'; // Rojo para niveles muy altos
    if (level >= 30) return '#ff6600'; // Naranja para niveles altos
    if (level >= 20) return '#ffaa00'; // Amarillo para niveles medios-altos
    if (level >= 10) return '#00ff00'; // Verde para niveles medios
    if (level >= 5) return '#0099ff';  // Azul para niveles bajos-medios
    return '#9966ff'; // Morado para niveles bajos
  }
};