const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const fetch = require('node-fetch');

const GIPHY_API_KEY = 'iXRpUBkiUXLXfEzFJGDY8qwZarKell7w';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelchannel')
    .setDescription('🆙 Configura el canal para notificaciones de nivel')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal donde se enviarán las notificaciones de nivel')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({
        content: '❌ Necesitas permisos de Gestionar Servidor para usar este comando.',
        ephemeral: true,
      });
    }

    const canal = interaction.options.getChannel('canal') || interaction.channel;

    if (canal.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '❌ Debes seleccionar un canal de texto válido.',
        ephemeral: true,
      });
    }

    if (!canal.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        content: '❌ No tengo permisos para enviar mensajes en ese canal.',
        ephemeral: true,
      });
    }

    const { db } = client.config;
    if (!db) {
      return interaction.reply({
        content: '❌ Error en la configuración de la base de datos. Contacta al administrador.',
        ephemeral: true,
      });
    }

    try {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO level_config (guild_id, level_channel_id) VALUES (?, ?)',
          [interaction.guild.id, canal.id],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ ¡Canal de Niveles Configurado!')
        .setDescription(`Las notificaciones de nivel se enviarán en ${canal.toString()}`)
        .addFields(
          { name: '📍 Canal', value: canal.toString(), inline: true },
          { name: '🆔 ID', value: canal.id, inline: true }
        )
        .setColor('#00ff00')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error al configurar el canal de niveles:', err);
      return interaction.reply({
        content: `❌ Error al guardar la configuración: ${err.message}`,
        ephemeral: true,
      });
    }
  },

  // Función que debes llamar cuando detectes un nivel subido
  async sendLevelUpNotification(client, guild, user, level, messageChannel) {
    const { db } = client.config;

    if (!db) {
      console.error('No hay base de datos configurada para levelchannel');
      return;
    }

    try {
      // Obtener canal configurado
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT level_channel_id FROM level_config WHERE guild_id = ?', [guild.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      let notifyChannel = null;
      if (row && row.level_channel_id) {
        notifyChannel = guild.channels.cache.get(row.level_channel_id);
      }

      // Si no hay canal o no tiene permisos, usar canal donde se subió nivel
      if (!notifyChannel || !notifyChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
        notifyChannel = messageChannel;
      }

      if (!notifyChannel) {
        console.warn('No se encontró un canal válido para enviar notificación de nivel');
        return;
      }

      // Crear imagen sakura kawaii con Canvas
      const attachment = await createSakuraLevelUpImage(user, level);

      const embed = new EmbedBuilder()
        .setTitle(`🌸 ¡${user.username} subió al nivel ${level}! 🌸`)
        .setColor('#ff69b4')
        .setImage('attachment://levelup.png')
        .setTimestamp();

      await notifyChannel.send({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error('Error al enviar notificación de nivel:', error);
    }
  }
};

// Función auxiliar para crear imagen con canvas y gif de sakura
async function createSakuraLevelUpImage(user, level) {
  const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=sakura&limit=10&rating=g`;

  let backgroundImageUrl;
  try {
    const res = await fetch(giphyUrl);
    const data = await res.json();
    const gif = data.data[Math.floor(Math.random() * data.data.length)];
    backgroundImageUrl = gif.images.downsized_still.url;
  } catch {
    backgroundImageUrl = null;
  }

  const canvas = Canvas.createCanvas(900, 300);
  const ctx = canvas.getContext('2d');

  if (backgroundImageUrl) {
    try {
      const res = await fetch(backgroundImageUrl);
      const buffer = await res.buffer();
      const background = await Canvas.loadImage(buffer);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Fondo sombra para texto
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 200, canvas.width, 100);

  // Texto felicitación
  ctx.font = '40px Sans';
  ctx.fillStyle = '#fff';
  ctx.fillText(`¡Felicidades, ${user.username}!`, 40, 240);

  ctx.font = '32px Sans';
  ctx.fillText(`Has subido al nivel ${level}! 🌸`, 40, 280);

  // Avatar circular con borde blanco
  const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png' }));

  const avatarX = 740;
  const avatarY = 30;
  const avatarSize = 120;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  const buffer = await canvas.encode('png');
  return new AttachmentBuilder(buffer, { name: 'levelup.png' });
}
