
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Muestra la latencia del bot'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: 'Calculando ping...', fetchReply: true });
    const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
    
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor('#9966ff')
      .addFields(
        { name: '📡 Latencia del Bot', value: `${timeDiff}ms`, inline: true },
        { name: '💓 Latencia de la API', value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },

  name: 'ping',
  async run(message, args, client) {
    const sent = await message.reply('Calculando ping...');
    const timeDiff = sent.createdTimestamp - message.createdTimestamp;
    
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor('#9966ff')
      .addFields(
        { name: '📡 Latencia del Bot', value: `${timeDiff}ms`, inline: true },
        { name: '💓 Latencia de la API', value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp();

    await sent.edit({ content: null, embeds: [embed] });
  }
};
