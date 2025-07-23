const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const fetch = require('node-fetch');
const { getUserLevelData, getTopLevels, getTopCoins, getTopGames } = require('../../utils/db'); // Supón que tienes funciones para cada top
const GIPHY_API_KEY = 'iXRpUBkiUXLXfEzFJGDY8qwZarKell7w';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tops')
    .setDescription('📊 Muestra las tablas de posiciones: niveles, economía, minijuegos y más'),

  async execute(interaction, client) {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_top')
        .setPlaceholder('📈 Elige una tabla de clasificación')
        .addOptions([
          { label: 'Top de Niveles', value: 'levels', emoji: '🎓' },
          { label: 'Top de Dinero', value: 'coins', emoji: '💰' },
          { label: 'Top de Minijuegos', value: 'games', emoji: '🎮' },
        ])
    );

    await interaction.reply({ content: 'Selecciona un top para ver la tabla 🏆', components: [menu] });
  },

  async select(interaction, client) {
    const selected = interaction.values[0];
    let topData;
    let title;

    switch (selected) {
      case 'levels':
        topData = await getTopLevels();
        title = '🎓 Top Niveles';
        break;
      case 'coins':
        topData = await getTopCoins();
        title = '💰 Top Economía';
        break;
      case 'games':
        topData = await getTopGames();
        title = '🎮 Top Juegos';
        break;
      default:
        return interaction.reply({ content: '❌ Opción inválida.', ephemeral: true });
    }

    const gifURL = await fetchSakuraGif();
    const image = await createTopImage(topData, title, gifURL);
    const attachment = new AttachmentBuilder(image, { name: 'top.png' });

    await interaction.update({ content: '', files: [attachment], components: [] });
  }
};

async function fetchSakuraGif() {
  const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=sakura+anime&limit=25&rating=pg`);
  const data = await res.json();
  const gifs = data.data.map(g => g.images.original.url);
  const random = gifs[Math.floor(Math.random() * gifs.length)];
  return random;
}

async function createTopImage(topData, title, gifURL) {
  const canvas = Canvas.createCanvas(700, 400);
  const ctx = canvas.getContext('2d');

  const bg = await Canvas.loadImage(gifURL);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffffcc';
  ctx.fillRect(30, 30, 640, 340);
  ctx.font = '28px Sans-serif';
  ctx.fillStyle = '#d63384';
  ctx.fillText(title, 40, 70);

  ctx.font = '20px Sans-serif';
  ctx.fillStyle = '#333';
  topData.slice(0, 10).forEach((user, i) => {
    ctx.fillText(`${i + 1}. ${user.username} - ${user.score}`, 50, 110 + i * 25);
  });

  return canvas.toBuffer();
}
