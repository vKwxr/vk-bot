
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Ve la tienda de artículos'),

  async execute(interaction, client) {
    const { economyDb } = client.config;

    economyDb.all(
      `SELECT * FROM shop_items ORDER BY category, price`,
      [],
      async (err, items) => {
        if (err) {
          return interaction.reply({
            content: '❌ Error al cargar la tienda.',
            ephemeral: true
          });
        }

        if (!items || items.length === 0) {
          // Agregar items por defecto
          const defaultItems = [
            ['VIP Role', 1000, 'Rol VIP por 30 días', '⭐', 'roles', 10],
            ['Custom Color', 500, 'Color personalizado', '🎨', 'roles', -1],
            ['Boost Pack', 2000, 'Pack de potenciadores', '🚀', 'boosts', 5],
            ['Lucky Box', 800, 'Caja misteriosa', '📦', 'items', -1]
          ];

          for (const item of defaultItems) {
            economyDb.run(
              `INSERT INTO shop_items (name, price, description, emoji, category, stock) VALUES (?, ?, ?, ?, ?, ?)`,
              item
            );
          }

          return interaction.reply({
            content: '🏪 Tienda inicializada. Usa el comando nuevamente para ver los artículos.',
            ephemeral: true
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🛍️ Tienda VK Community')
          .setDescription('Usa `/buy` para comprar artículos')
          .setColor('#9966ff')
          .setTimestamp();

        const categories = {};
        items.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push(item);
        });

        Object.keys(categories).forEach(category => {
          const categoryItems = categories[category];
          const itemList = categoryItems.map(item => {
            const stock = item.stock === -1 ? '∞' : item.stock;
            return `${item.emoji} **${item.name}** - ${item.price} monedas\n${item.description} (Stock: ${stock})`;
          }).join('\n\n');

          embed.addFields({
            name: `📂 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: itemList,
            inline: false
          });
        });

        await interaction.reply({ embeds: [embed] });
      }
    );
  },

  name: 'shop',
  async run(message, args, client) {
    // Similar implementation for prefix command
    const { economyDb } = client.config;

    economyDb.all(
      `SELECT * FROM shop_items ORDER BY category, price`,
      [],
      async (err, items) => {
        if (err) {
          return message.reply('❌ Error al cargar la tienda.');
        }

        if (!items || items.length === 0) {
          return message.reply('🏪 La tienda está vacía.');
        }

        const embed = new EmbedBuilder()
          .setTitle('🛍️ Tienda VK Community')
          .setDescription('Usa `vkbuy` para comprar artículos')
          .setColor('#9966ff')
          .setTimestamp();

        const categories = {};
        items.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push(item);
        });

        Object.keys(categories).forEach(category => {
          const categoryItems = categories[category];
          const itemList = categoryItems.map(item => {
            const stock = item.stock === -1 ? '∞' : item.stock;
            return `${item.emoji} **${item.name}** - ${item.price} monedas\n${item.description} (Stock: ${stock})`;
          }).join('\n\n');

          embed.addFields({
            name: `📂 ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            value: itemList,
            inline: false
          });
        });

        await message.reply({ embeds: [embed] });
      }
    );
  }
};
