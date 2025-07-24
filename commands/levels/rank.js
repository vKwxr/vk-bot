const path = require('path');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const fetch = require('node-fetch');

const GIPHY_API_KEY = 'iXRpUBkiUXLXfEzFJGDY8qwZarKell7w';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('🎖️ Muestra tu nivel o el de otro usuario con un estilo visual')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario para ver su nivel')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    if (user.bot) {
      return interaction.reply({ content: '❌ Los bots no tienen niveles.', ephemeral: true });
    }

    client.config.levelsDb.get("SELECT * FROM levels WHERE user_id = ?", [user.id], async (err, row) => {
      if (err || !row) {
        return interaction.reply({ content: `❌ No hay datos de nivel para ${user.username}.`, ephemeral: true });
      }

      const positionQuery = "SELECT COUNT(*) as position FROM levels WHERE xp > ? OR (xp = ? AND user_id < ?)";
      client.config.levelsDb.get(positionQuery, [row.xp, row.xp, user.id], async (err, posRow) => {
        const position = (posRow?.position || 0) + 1;

        const xpCurrent = row.xp - ((row.level - 1) * 1000);
        const xpNeeded = 1000;
        const xpPercentage = xpCurrent / xpNeeded;

        const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=sakura&limit=10&rating=g`;
        let backgroundImageUrl = null;
        try {
          const response = await fetch(giphyUrl);
          const data = await response.json();
          if (data.data.length === 0) {
            return interaction.reply({ content: '❌ No se encontraron gifs de sakura.', ephemeral: true });
          }
          const gif = data.data[Math.floor(Math.random() * data.data.length)];
          backgroundImageUrl = gif.images.downsized_still.url;
        } catch (e) {
          return interaction.reply({ content: '❌ Error al obtener el gif de sakura.', ephemeral: true });
        }

        const canvas = Canvas.createCanvas(900, 300);
        const ctx = canvas.getContext('2d');

        const res = await fetch(backgroundImageUrl);
        const buffer = await res.buffer();
        const background = await Canvas.loadImage(buffer);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        const marcoColors = {
          1: '#FFD700',  // Oro
          2: '#C0C0C0',  // Plata
          3: '#CD7F32'   // Bronce
        };

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 200, canvas.width, 100);

        if (position <= 3) {
          ctx.strokeStyle = marcoColors[position];
          ctx.lineWidth = 8;
          ctx.strokeRect(0 + 4, 200 + 4, canvas.width - 8, 100 - 8);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 4;
          ctx.strokeRect(0 + 2, 200 + 2, canvas.width - 4, 100 - 4);
        }

        ctx.font = '30px Sans';
        ctx.fillStyle = '#fff';
        ctx.fillText(user.username, 40, 240);

        ctx.font = '22px Sans';
        ctx.fillText(`Nivel: ${row.level} | XP: ${xpCurrent}/1000 | Ranking: #${position}`, 40, 275);

        const barX = 500;
        const barY = 235;
        const barWidth = 360;
        const barHeight = 25;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ff69b4'; // rosa sakura
        ctx.fillRect(barX, barY, barWidth * xpPercentage, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png' }));

        const avatarX = 740;
        const avatarY = 30;
        const avatarSize = 120;

        if (position <= 3) {
          ctx.strokeStyle = marcoColors[position];
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'rank.png' });
        await interaction.reply({ files: [attachment] });
      });
    });
  }
};
