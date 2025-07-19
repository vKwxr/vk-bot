
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('⏱️ Muestra el tiempo que el bot ha estado activo'),

  async execute(interaction, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    const seconds = Math.floor(((uptime % 86400) % 3600) % 60);
    
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Tiempo Activo')
      .setDescription(`El bot ha estado activo por:\n**${days}d ${hours}h ${minutes}m ${seconds}s**`)
      .setColor('#9966ff')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'uptime',
  async run(message, args, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    const seconds = Math.floor(((uptime % 86400) % 3600) % 60);
    
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Tiempo Activo')
      .setDescription(`El bot ha estado activo por:\n**${days}d ${hours}h ${minutes}m ${seconds}s**`)
      .setColor('#9966ff')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
};
