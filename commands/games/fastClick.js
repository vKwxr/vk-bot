const path = require('path');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fastclick')
    .setDescription('Demuestra tus reflejos haciendo clic lo más rápido posible'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const button = new ButtonBuilder()
      .setCustomId('click_me')
      .setLabel('¡Haz clic aquí!')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    const message = await interaction.reply({
      content: 'Prepárate... El botón aparecerá en breve.',
      components: [],
      fetchReply: true
    });

    const delay = Math.floor(Math.random() * 4000) + 2000; // entre 2 y 6 segundos

    setTimeout(async () => {
      const newMsg = await interaction.editReply({
        content: '¡Haz clic lo más rápido posible!',
        components: [row]
      });

      const startTime = Date.now();

      const collector = newMsg.createMessageComponentCollector({
        filter: i => i.customId === 'click_me' && i.user.id === userId,
        max: 1,
        time: 5000
      });

      collector.on('collect', async i => {
        const reactionTime = Date.now() - startTime;
        await i.update({
          content: `⏱️ ¡Tu tiempo de reacción fue de **${reactionTime}ms**!`,
          components: []
        });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({
            content: '❌ Se acabó el tiempo. ¡No fuiste lo suficientemente rápido!',
            components: []
          });
        }
      });

    }, delay);
  }
};
