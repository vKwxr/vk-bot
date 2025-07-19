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
    try {
      const { economyDb } = client.config;
      const item = interaction.options.getString('articulo');
      const userId = interaction.user.id;

      if (!economyDb) {
        return interaction.reply({
          content: '❌ Error de base de datos. Contacta al administrador.',
          ephemeral: true
        });
      }

      // Buscar artículo
      economyDb.get(
        `SELECT * FROM shop_items WHERE name LIKE ? OR id = ?`,
        [`%${item}%`, parseInt(item) || 0],
        async (err, shopItem) => {
          try {
            if (err) {
              console.error('Error buscando artículo:', err);
              return interaction.reply({
                content: '❌ Error al buscar el artículo.',
                ephemeral: true
              });
            }

            if (!shopItem) {
              return interaction.reply({
                content: '❌ Artículo no encontrado en la tienda. Usa `/shop` para ver los disponibles.',
                ephemeral: true
              });
            }

            // Verificar stock
            if (shopItem.stock === 0) {
              return interaction.reply({
                content: '❌ Este artículo está agotado.',
                ephemeral: true
              });
            }

            // Verificar dinero del usuario
            economyDb.get(
              `SELECT * FROM economy WHERE user_id = ?`,
              [userId],
              async (err, userEconomy) => {
                try {
                  if (err) {
                    console.error('Error verificando economía:', err);
                    return interaction.reply({
                      content: '❌ Error al verificar tu balance.',
                      ephemeral: true
                    });
                  }

                  // Crear registro de economía si no existe
                  if (!userEconomy) {
                    economyDb.run(
                      `INSERT OR IGNORE INTO economy (user_id, wallet, bank) VALUES (?, 0, 0)`,
                      [userId],
                      (err) => {
                        if (err) console.error('Error creando economía:', err);
                      }
                    );
                    userEconomy = { wallet: 0, bank: 0 };
                  }

                  const userMoney = userEconomy.wallet || 0;

                  if (userMoney < shopItem.price) {
                    return interaction.reply({
                      content: `❌ No tienes suficiente dinero. Necesitas **${shopItem.price}** monedas pero solo tienes **${userMoney}**.`,
                      ephemeral: true
                    });
                  }

                  // Realizar compra
                  const newWallet = userMoney - shopItem.price;

                  economyDb.run(
                    `UPDATE economy SET wallet = ? WHERE user_id = ?`,
                    [newWallet, userId],
                    (err) => {
                      try {
                        if (err) {
                          console.error('Error actualizando wallet:', err);
                          return interaction.reply({
                            content: '❌ Error al procesar la compra.',
                            ephemeral: true
                          });
                        }

                        // Actualizar stock si no es ilimitado
                        if (shopItem.stock > 0) {
                          economyDb.run(
                            `UPDATE shop_items SET stock = stock - 1 WHERE id = ?`,
                            [shopItem.id],
                            (err) => {
                              if (err) console.error('Error actualizando stock:', err);
                            }
                          );
                        }

                        // Agregar al inventario
                        economyDb.run(
                          `INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1)
                           ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`,
                          [userId, shopItem.id],
                          (err) => {
                            if (err) console.error('Error agregando al inventario:', err);
                          }
                        );

                        const embed = new EmbedBuilder()
                          .setTitle('🛍️ Compra Exitosa')
                          .setDescription(`Has comprado **${shopItem.name}** ${shopItem.emoji}`)
                          .addFields(
                            { name: '💰 Precio Pagado', value: `${shopItem.price} monedas`, inline: true },
                            { name: '💳 Dinero Restante', value: `${newWallet} monedas`, inline: true },
                            { name: '📦 Descripción', value: shopItem.description, inline: false }
                          )
                          .setColor('#00ff00')
                          .setFooter({ text: 'VK Community • Compra procesada' })
                          .setTimestamp();

                        interaction.reply({ embeds: [embed] });
                      } catch (error) {
                        console.error('Error en procesamiento de compra:', error);
                        interaction.reply({
                          content: '❌ Error inesperado al procesar la compra.',
                          ephemeral: true
                        });
                      }
                    }
                  );
                } catch (error) {
                  console.error('Error en verificación de economía:', error);
                  interaction.reply({
                    content: '❌ Error inesperado en la verificación.',
                    ephemeral: true
                  });
                }
              }
            );
          } catch (error) {
            console.error('Error en búsqueda de artículo:', error);
            interaction.reply({
              content: '❌ Error inesperado al buscar el artículo.',
              ephemeral: true
            });
          }
        }
      );
    } catch (error) {
      console.error('Error general en comando buy:', error);
      if (!interaction.replied) {
        interaction.reply({
          content: '❌ Error crítico al procesar la compra. Contacta al administrador.',
          ephemeral: true
        });
      }
    }
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