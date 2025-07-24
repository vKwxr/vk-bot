const path = require('path');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backpack')
    .setDescription('🎒 Mira los objetos que tienes en tu mochila'),

  async execute(interaction, client) {
    const userId = interaction.user.id;
    const db = client.config.economyDb;

    db.all(`SELECT * FROM inventory WHERE user_id = ?`, [userId], async (err, rows) => {
      if (err) return interaction.reply({ content: '❌ Error al acceder a la mochila.', ephemeral: true });

      if (!rows || rows.length === 0) {
        return interaction.reply({ content: '🎒 Tu mochila está vacía.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎒 Tu Mochila')
        .setDescription('Estos son los objetos que tienes en tu mochila:')
        .setColor('#ffa500');

      for (const item of rows) {
        embed.addFields({
          name: `🧱 ${item.item_name}`,
          value: `Cantidad: **${item.quantity}** | Rareza: **${item.rarity}**`,
          inline: false,
        });
      }

      const openButton = new ButtonBuilder()
        .setCustomId('open_luckybox')
        .setLabel('🎁 Abrir Lucky Box')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(openButton);

      await interaction.reply({ embeds: [embed], components: [row] });
    });
  },

  async component(interaction, client) {
    const userId = interaction.user.id;
    const db = client.config.economyDb;

    db.get(`SELECT * FROM inventory WHERE user_id = ? AND item_name = 'Lucky Box'`, [userId], async (err, row) => {
      if (err || !row || row.quantity < 1) {
        return interaction.reply({ content: '❌ No tienes Lucky Box para abrir.', ephemeral: true });
      }

      db.run(`UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_name = 'Lucky Box'`, [userId]);

      const rewards = [
        { name: 'Diamante', rarity: 'legendario' },
        { name: 'Oro', rarity: 'épico' },
        { name: 'Plata', rarity: 'raro' },
        { name: 'Bronce', rarity: 'común' },
      ];

      const premio = rewards[Math.floor(Math.random() * rewards.length)];

      db.run(
        `INSERT INTO inventory (user_id, item_name, quantity, rarity)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(user_id, item_name)
         DO UPDATE SET quantity = quantity + 1`,
        [userId, premio.name, premio.rarity]
      );

      const embed = new EmbedBuilder()
        .setTitle('🎉 ¡Has abierto una Lucky Box!')
        .setDescription(`¡Felicidades! Has ganado **${premio.name}** de rareza **${premio.rarity}**.`)
        .setColor('#00ffcc')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    });
  },
};
