const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Ve la tienda de artículos'),

  async execute(interaction, client) {
    const { economyDb } = client.config;

    economyDb.all(`SELECT * FROM shop_items ORDER BY category, price`, [], async (err, items) => {
      if (err) {
        return interaction.reply({
          content: '❌ Hubo un error al cargar la tienda.',
          ephemeral: true,
        });
      }

      if (!items || items.length === 0) {
        const defaultItems = [
          ['VIP Role', 1000, 'Obtén el rol VIP por 30 días', '👑', 'roles', 10],
          ['Color Personalizado', 750, 'Elige un color único para tu nombre', '🎨', 'roles', -1],
          ['Boost Pack', 2000, 'Activa mejoras por una semana', '⚡', 'boosts', 5],
          ['Lucky Box', 1200, 'Caja sorpresa con premios aleatorios', '🎁', 'items', 7],
          ['Nickname Fancy', 650, 'Ponle estilo a tu nombre', '✨', 'custom', -1]
        ];

        for (const item of defaultItems) {
          economyDb.run(
            `INSERT INTO shop_items (name, price, description, emoji, category, stock) VALUES (?, ?, ?, ?, ?, ?)`,
            item
          );
        }

        return interaction.reply({
          content: '🏪 Tienda inicializada. Usa el comando nuevamente para ver los artículos.',
          ephemeral: true,
        });
      }

      const itemsPerPage = 5;
      let page = 0;
      const totalPages = Math.ceil(items.length / itemsPerPage);

      const generateEmbed = (pageIndex) => {
        const embed = new EmbedBuilder()
          .setTitle('🛒 VK Shop - Página ' + (pageIndex + 1) + '/' + totalPages)
          .setDescription('Utiliza `/buy` seguido del nombre del artículo para comprar.')
          .setColor('#a259ff')
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/2331/2331942.png')
          .setFooter({ text: 'Sistema de economía vK • vkbot' })
          .setTimestamp();

        const currentItems = items.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
        currentItems.forEach(item => {
          const stock = item.stock === -1 ? '∞' : item.stock;
          embed.addFields({
            name: `${item.emoji} ${item.name} — \`${item.price.toLocaleString()} vK Coins\``,
            value: `📝 ${item.description}\n📦 Stock: ${stock}`,
            inline: false
          });
        });

        return embed;
      };

      const getButtons = (pageIndex) => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('◀️ Anterior')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === 0),

        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Siguiente ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIndex === totalPages - 1)
      );

      const message = await interaction.reply({
        embeds: [generateEmbed(page)],
        components: [getButtons(page)],
        fetchReply: true
      });

      const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.customId === 'prev_page' && page > 0) page--;
        else if (i.customId === 'next_page' && page < totalPages - 1) page++;

        await i.update({
          embeds: [generateEmbed(page)],
          components: [getButtons(page)]
        });
      });

      collector.on('end', async () => {
        if (message.editable) {
          await message.edit({ components: [] });
        }
      });
    });
  }
};
