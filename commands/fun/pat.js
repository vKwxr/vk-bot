const path = require('path');

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('🐾 Hazle pat a alguien de manera tierna')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a quien hacerle pat')
        .setRequired(true)
    ),

  name: 'pat',
  description: 'Hazle pat a alguien',
  usage: 'vk pat @usuario',

  async execute(interaction, client) {
    const target = interaction.options.getUser('usuario');
    await this.handlePat(interaction, interaction.user, target, client);
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply('❌ **Debes mencionar a alguien**\n📝 Uso: `vk pat @usuario`');
    }
    await this.handlePat(message, message.author, target, client);
  },

  async handlePat(context, author, target, client) {
    if (target.id === author.id) {
      return context.reply('🤔 ¡No puedes hacerte pat a ti mismo!');
    }

    const gifUrl = await this.getGiphyGif('anime pat head', client);

    const embed = new EmbedBuilder()
      .setTitle('🐾 ¡Pat Pat!')
      .setDescription(`${author} le hace pat a ${target} en la cabecita 💕`)
      .setImage(gifUrl)
      .setColor('#87CEEB')
      .setFooter({ text: 'VK Community • ¡Qué tierno!' })
      .setTimestamp();

    const isInteraction = context.replied !== undefined;
    return isInteraction 
      ? await context.reply({ embeds: [embed] })
      : await context.reply({ embeds: [embed] });
  },

  async getGiphyGif(searchTerm, client) {
    try {
      const { GIPHY_API_KEY } = client.config;
      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchTerm,
          limit: 10,
          rating: 'pg'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        const randomGif = response.data.data[Math.floor(Math.random() * response.data.data.length)];
        return randomGif.images.original.url;
      }
    } catch (error) {
      console.error('Error obteniendo GIF de Giphy:', error);
    }
    
    return 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif';
  }
};
