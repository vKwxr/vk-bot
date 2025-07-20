
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');

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

      // Crear imagen de nivel personalizada
      const attachment = await this.createLevelCard(targetUser, level, xpProgress, xpNeeded);

      const embed = new EmbedBuilder()
        .setTitle(`🆙 Nivel de ${targetUser.username}`)
        .setDescription(`**Nivel:** ${level}\n**XP:** ${xpProgress}/${xpNeeded}\n**XP Total:** ${xp}`)
        .setColor('#9966ff')
        .setImage('attachment://level-card.png')
        .setFooter({ text: 'VK Community • Sistema de Niveles' })
        .setTimestamp();

      return isInteraction 
        ? await context.reply({ embeds: [embed], files: [attachment] })
        : await context.reply({ embeds: [embed], files: [attachment] });

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

  async createLevelCard(user, level, currentXP, neededXP) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 800, 300);
    gradient.addColorStop(0, '#9966ff');
    gradient.addColorStop(1, '#6633cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 300);

    // Avatar del usuario
    try {
      const avatarSize = user.displayAvatarURL({ format: 'png', size: 128 });
      const avatar = await loadImage(avatarSize);
      
      // Círculo para el avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(100, 150, 60, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 40, 90, 120, 120);
      ctx.restore();

      // Borde del avatar
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(100, 150, 60, 0, Math.PI * 2);
      ctx.stroke();
    } catch (error) {
      console.error('Error cargando avatar:', error);
    }

    // Nombre del usuario
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(user.username, 200, 100);

    // Nivel
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Nivel ${level}`, 200, 140);

    // Barra de progreso
    const barWidth = 400;
    const barHeight = 20;
    const barX = 200;
    const barY = 180;

    // Fondo de la barra
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progreso
    const progress = currentXP / neededXP;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Texto de XP
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(`${currentXP} / ${neededXP} XP`, barX, barY + 40);

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'level-card.png' });
  }
};
