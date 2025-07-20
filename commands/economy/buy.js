const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('💳 Comprar artículos de la tienda')
    .addStringOption(option =>
      option.setName('articulo')
        .setDescription('Nombre del artículo a comprar')
        .setRequired(false)
    ),

  name: 'buy',
  description: 'Comprar artículos',
  usage: 'vk buy [artículo]',

  async execute(interaction, client) {
    const articulo = interaction.options.getString('articulo');
    if (articulo) {
      await this.handleBuy(interaction, interaction.user, articulo, client);
    } else {
      await this.showShopMenu(interaction, client);
    }
  },

  async run(message, args, client) {
    if (args.length === 0) {
      return this.showShopMenu(message, client);
    }

    const articulo = args.join(' ');
    await this.handleBuy(message, message.author, articulo, client);
  },

  async showShopMenu(context, client) {
    const { economyDb } = client.config;
    const isInteraction = context.replied !== undefined;

    economyDb.all('SELECT * FROM shop_items WHERE stock != 0 ORDER BY category, price', [], async (err, items) => {
      if (err || !items.length) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Tienda Vacía')
          .setDescription('No hay artículos disponibles en la tienda.')
          .setColor('#ff0000');

        return isInteraction 
          ? await context.reply({ embeds: [embed], ephemeral: true })
          : await context.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setTitle('🛒 Tienda VK - Compra Rápida')
        .setDescription('Selecciona un artículo del menú para comprarlo directamente')
        .setColor('#9966ff')
        .setFooter({ text: 'VK Community • Sistema de Tienda' })
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('quick_buy_select')
        .setPlaceholder('🛍️ Selecciona un artículo para comprar')
        .setMaxValues(1);

      const categories = {};
      items.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
      });

      Object.keys(categories).forEach(category => {
        categories[category].forEach(item => {
          const stock = item.stock === -1 ? '∞' : item.stock;
          selectMenu.addOptions({
            label: `${item.name} - $${item.price}`,
            description: `${item.description.substring(0, 80)}... (Stock: ${stock})`,
            value: `buy_${item.id}`,
            emoji: item.emoji
          });
        });
      });

      const row = new ActionRowBuilder().addComponents(selectMenu);

      return isInteraction 
        ? await context.reply({ embeds: [embed], components: [row] })
        : await context.reply({ embeds: [embed], components: [row] });
    });
  },

  async handleBuy(context, user, itemName, client) {
    const { economyDb } = client.config;
    const isInteraction = context.replied !== undefined;

    economyDb.get('SELECT * FROM economy WHERE user_id = ?', [user.id], (err, userEconomy) => {
      if (err || !userEconomy) {
        const embed = new EmbedBuilder()
          .setTitle('❌ No tienes una cuenta')
          .setDescription('Usa `/daily` para crear tu cuenta de economía.')
          .setColor('#ff0000');

        return isInteraction 
          ? context.reply({ embeds: [embed], ephemeral: true })
          : context.reply({ embeds: [embed] });
      }

      economyDb.get('SELECT * FROM shop_items WHERE LOWER(name) = LOWER(?)', [itemName], (err, item) => {
        if (err || !item) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Artículo no encontrado')
            .setDescription(`No se encontró "${itemName}" en la tienda.\nUsa \`/shop\` para ver los artículos disponibles.`)
            .setColor('#ff0000');

          return isInteraction 
            ? context.reply({ embeds: [embed], ephemeral: true })
            : context.reply({ embeds: [embed] });
        }

        if (item.stock === 0) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Sin Stock')
            .setDescription(`${item.emoji} **${item.name}** está agotado.`)
            .setColor('#ff0000');

          return isInteraction 
            ? context.reply({ embeds: [embed], ephemeral: true })
            : context.reply({ embeds: [embed] });
        }

        if (userEconomy.wallet < item.price) {
          const embed = new EmbedBuilder()
            .setTitle('❌ Dinero Insuficiente')
            .setDescription(`Necesitas **$${item.price}** pero solo tienes **$${userEconomy.wallet}**.`)
            .setColor('#ff0000');

          return isInteraction 
            ? context.reply({ embeds: [embed], ephemeral: true })
            : context.reply({ embeds: [embed] });
        }

        // Realizar compra
        economyDb.run('UPDATE economy SET wallet = wallet - ? WHERE user_id = ?', [item.price, user.id]);

        if (item.stock > 0) {
          economyDb.run('UPDATE shop_items SET stock = stock - 1 WHERE id = ?', [item.id]);
        }

        economyDb.run('INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1)', [user.id, item.id]);

        let extraInfo = '';
        if (['roles', 'cosmetic', 'permisos'].includes(item.category)) {
          extraInfo = '\n\n🎫 **¡Crea un ticket de tipo "Recompensas" para reclamar tu compra!**';
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Compra Exitosa')
          .setDescription(`Has comprado **${item.emoji} ${item.name}** por **$${item.price}**${extraInfo}`)
          .addFields(
            { name: '💰 Dinero Restante', value: `$${userEconomy.wallet - item.price}`, inline: true },
            { name: '📦 Artículo', value: item.description, inline: false }
          )
          .setColor('#00ff00')
          .setFooter({ text: 'VK Community • ¡Gracias por tu compra!' })
          .setTimestamp();

        return isInteraction 
          ? context.reply({ embeds: [embed] })
          : context.reply({ embeds: [embed] });
      });
    });
  }
};