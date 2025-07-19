
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('🛒 Compra un artículo de la tienda')
    .addStringOption(option =>
      option.setName('articulo')
        .setDescription('Nombre del artículo a comprar')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a comprar')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction, client) {
    const { economyDb } = client.config;
    const userId = interaction.user.id;
    const articulo = interaction.options.getString('articulo');
    const cantidad = interaction.options.getInteger('cantidad') || 1;

    // Buscar artículo
    economyDb.get(
      `SELECT * FROM shop_items WHERE LOWER(name) LIKE LOWER(?)`,
      [`%${articulo}%`],
      async (err, item) => {
        if (err || !item) {
          return interaction.reply({
            content: '❌ Artículo no encontrado en la tienda.',
            ephemeral: true
          });
        }

        // Verificar stock
        if (item.stock !== -1 && item.stock < cantidad) {
          return interaction.reply({
            content: `❌ No hay suficiente stock. Disponible: ${item.stock}`,
            ephemeral: true
          });
        }

        const totalPrice = item.price * cantidad;

        // Verificar dinero del usuario
        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [userId],
          async (err, userEconomy) => {
            if (err) {
              return interaction.reply({
                content: '❌ Error al acceder a tu economía.',
                ephemeral: true
              });
            }

            if (!userEconomy) {
              economyDb.run(
                `INSERT INTO economy (user_id) VALUES (?)`,
                [userId]
              );
              return interaction.reply({
                content: '❌ No tienes dinero suficiente.',
                ephemeral: true
              });
            }

            if (userEconomy.wallet < totalPrice) {
              return interaction.reply({
                content: `❌ No tienes dinero suficiente. Necesitas ${totalPrice} monedas pero tienes ${userEconomy.wallet}.`,
                ephemeral: true
              });
            }

            // Procesar compra
            const newWallet = userEconomy.wallet - totalPrice;
            
            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newWallet, userId],
              async (err) => {
                if (err) {
                  return interaction.reply({
                    content: '❌ Error al procesar la compra.',
                    ephemeral: true
                  });
                }

                // Actualizar stock si no es infinito
                if (item.stock !== -1) {
                  economyDb.run(
                    `UPDATE shop_items SET stock = stock - ? WHERE id = ?`,
                    [cantidad, item.id]
                  );
                }

                // Agregar al inventario
                economyDb.run(
                  `INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)
                   ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?`,
                  [userId, item.id, cantidad, cantidad]
                );

                const embed = new EmbedBuilder()
                  .setTitle('🛒 Compra Exitosa')
                  .setDescription(`Has comprado **${cantidad}x ${item.emoji} ${item.name}**`)
                  .addFields(
                    { name: '💰 Precio Total', value: `${totalPrice} monedas`, inline: true },
                    { name: '💵 Dinero Restante', value: `${newWallet} monedas`, inline: true }
                  )
                  .setColor('#00ff00')
                  .setTimestamp();

                await interaction.reply({ embeds: [embed] });
              }
            );
          }
        );
      }
    );
  },

  name: 'buy',
  async run(message, args, client) {
    if (!args[0]) {
      return message.reply('❌ Especifica el artículo a comprar.');
    }

    const { economyDb } = client.config;
    const userId = message.author.id;
    const articulo = args.join(' ');

    economyDb.get(
      `SELECT * FROM shop_items WHERE LOWER(name) LIKE LOWER(?)`,
      [`%${articulo}%`],
      async (err, item) => {
        if (err || !item) {
          return message.reply('❌ Artículo no encontrado en la tienda.');
        }

        economyDb.get(
          `SELECT * FROM economy WHERE user_id = ?`,
          [userId],
          async (err, userEconomy) => {
            if (err || !userEconomy || userEconomy.wallet < item.price) {
              return message.reply('❌ No tienes dinero suficiente.');
            }

            const newWallet = userEconomy.wallet - item.price;
            
            economyDb.run(
              `UPDATE economy SET wallet = ? WHERE user_id = ?`,
              [newWallet, userId]
            );

            if (item.stock !== -1) {
              economyDb.run(
                `UPDATE shop_items SET stock = stock - 1 WHERE id = ?`,
                [item.id]
              );
            }

            const embed = new EmbedBuilder()
              .setTitle('🛒 Compra Exitosa')
              .setDescription(`Has comprado **${item.emoji} ${item.name}**`)
              .addFields(
                { name: '💰 Precio', value: `${item.price} monedas`, inline: true },
                { name: '💵 Dinero Restante', value: `${newWallet} monedas`, inline: true }
              )
              .setColor('#00ff00')
              .setTimestamp();

            await message.reply({ embeds: [embed] });
          }
        );
      }
    );
  }
};
