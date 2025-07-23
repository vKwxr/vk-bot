const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('🎒 Ver tu mochila con los ítems que has comprado'),

  async execute(interaction, client) {
    const userId = interaction.user.id;

    client.config.economyDb.all(
      `SELECT * FROM inventory WHERE user_id = ?`,
      [userId],
      async (err, rows) => {
        if (err) {
          console.error(err);
          return interaction.reply({ content: '❌ Error al acceder a la base de datos.', ephemeral: true });
        }

        if (!rows || rows.length === 0) {
          return interaction.reply({ content: '🎒 Tu mochila está vacía. Compra algo en la tienda con `/buy`.', ephemeral: true });
        }

        const pages = [];
        const itemsPerPage = 5;
        for (let i = 0; i < rows.length; i += itemsPerPage) {
          const currentItems = rows.slice(i, i + itemsPerPage);
          const embed = new EmbedBuilder()
            .setTitle(`🎒 Mochila de ${interaction.user.username}`)
            .setColor('#ffaa00')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

          currentItems.forEach(item => {
            embed.addFields({
              name: `📦 ${item.item_name}`,
              value: `Cantidad: **${item.quantity}**\nID: \`${item.item_id}\``,
              inline: false
            });
          });

          embed.setFooter({ text: `Página ${Math.floor(i / itemsPerPage) + 1} de ${Math.ceil(rows.length / itemsPerPage)}` });
          pages.push(embed);
        }

        let page = 0;
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('prev_page').setLabel('⬅').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('use_item').setLabel('🎁 Usar Lucky Box').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('next_page').setLabel('➡').setStyle(ButtonStyle.Secondary)
        );

        const msg = await interaction.reply({ embeds: [pages[page]], components: [buttons], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 60_000 });

        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Este botón no es para ti.', ephemeral: true });

          if (i.customId === 'next_page') {
            page = (page + 1) % pages.length;
            await i.update({ embeds: [pages[page]], components: [buttons] });
          }

          if (i.customId === 'prev_page') {
            page = (page - 1 + pages.length) % pages.length;
            await i.update({ embeds: [pages[page]], components: [buttons] });
          }

          if (i.customId === 'use_item') {
            const luckyBox = rows.find(item => item.item_id === 'luckybox');

            if (!luckyBox || luckyBox.quantity <= 0) {
              return i.reply({ content: '🎁 No tienes ninguna Lucky Box para abrir.', ephemeral: true });
            }

            const rewards = [
              { name: 'Monedas', type: 'money', amount: Math.floor(Math.random() * 2000) + 1000 },
              { name: 'Item Bonus', type: 'item', item_id: 'bonus', quantity: 1 },
              { name: 'Nada 😢', type: 'none' }
            ];
            const reward = rewards[Math.floor(Math.random() * rewards.length)];

            let result = '';
            if (reward.type === 'money') {
              client.config.economyDb.run(`UPDATE economy SET wallet = wallet + ? WHERE user_id = ?`, [reward.amount, userId]);
              result = `Ganaste **${reward.amount.toLocaleString()}** monedas 🎉`;
            } else if (reward.type === 'item') {
              client.config.economyDb.run(`
                INSERT INTO inventory (user_id, item_id, item_name, quantity)
                VALUES (?, ?, ?, 1)
                ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1
              `, [userId, reward.item_id, reward.name]);
              result = `Recibiste un nuevo ítem: **${reward.name}** 🧩`;
            } else {
              result = 'No ganaste nada esta vez... 💔';
            }

            // Restar 1 Lucky Box
            client.config.economyDb.run(
              `UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = 'luckybox'`,
              [userId]
            );

            const openEmbed = new EmbedBuilder()
              .setTitle('🎁 Abriste una Lucky Box')
              .setDescription(result)
              .setColor('#55ff55')
              .setTimestamp();

            await i.reply({ embeds: [openEmbed], ephemeral: true });
          }
        });

        collector.on('end', () => {
          msg.edit({ components: [] }).catch(() => {});
        });
      }
    );
  }
};
