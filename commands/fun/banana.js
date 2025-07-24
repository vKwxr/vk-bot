const path = require('path');

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banana')
    .setDescription('🍌 Mide el tamaño de tu banana')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a medir (opcional)')
        .setRequired(false)),

  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const size = Math.floor(Math.random() * 25) + 1;
    
    let emoji = '🍌';
    let description = '';
    
    if (size <= 5) {
      description = 'Muy pequeña... 😅';
    } else if (size <= 10) {
      description = 'Tamaño promedio 😐';
    } else if (size <= 15) {
      description = '¡Bastante grande! 😏';
    } else if (size <= 20) {
      description = '¡Impresionante! 😱';
    } else {
      description = '¡MONSTRUOSA! 🤯';
      emoji = '🍆';
    }

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Medidor de Banana`)
      .setDescription(`**${user.username}**, tu banana mide **${size} cm**\n\n${description}`)
      .setColor('#ffff00')
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'banana',
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const size = Math.floor(Math.random() * 25) + 1;
    
    let emoji = '🍌';
    let description = '';
    
    if (size <= 5) {
      description = 'Muy pequeña... 😅';
    } else if (size <= 10) {
      description = 'Tamaño promedio 😐';
    } else if (size <= 15) {
      description = '¡Bastante grande! 😏';
    } else if (size <= 20) {
      description = '¡Impresionante! 😱';
    } else {
      description = '¡MONSTRUOSA! 🤯';
      emoji = '🍆';
    }

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Medidor de Banana`)
      .setDescription(`**${user.username}**, tu banana mide **${size} cm**\n\n${description}`)
      .setColor('#ffff00')
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
